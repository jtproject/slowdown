import { readFile } from 'fs/promises'
import { join, resolve, extname, dirname } from 'path'
import { fileURLToPath } from 'url'

// Get current directory path (ES Module equivalent of __dirname)
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// MIME types for common web files
const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml'
}

const API_ACTIONS = [
  'create',
  'read',
  'update',
  'delete'
]

const API_ACTION_GROUPS = [
  'one',
  'many',
  'all'
]

// Base request wrapper that holds the http `req` and `res` objects
// and provides common helpers for subclasses
class ServerRequest {
	constructor (req, res, db = null) {
		this.req = req
		this.res = res
		this.db = db || null
		this.statusCode = 200
		this.data = null
		this.error = null
	}

	// Convenience: set route string parsed from URL
	setRoute (route) {
		this.route = route
	}

	// Convenience: set response body (object or string)
	setData (data) {
		this.data = data
	}

	// Convenience: set HTTP status code
	setStatusCode (code) {
		this.statusCode = code
	}

	// Redirect helper: sets 302 and location header
	redirect (location) {
		this.setStatusCode(302)
		this.res.writeHead(
			this.statusCode, 
			{ Location: location }
		)
		this.res.end()
	}

	// Base end() function used by all request types
	end (options = {}) {
		const { 
			contentType = 'application/json',
			headers = {},
			override = undefined 
		} = options

		// Prepare response headers
		const responseHeaders = {
			'Content-Type': contentType,
			...headers
		}

		// Prepare body based on content type and data
		let body = override || this.data
		if (contentType === 'application/json' && typeof body !== 'string') {
			body = JSON.stringify(body || {})
		}

		this.res.writeHead(this.statusCode, responseHeaders)
		this.res.end(body)
	}
}

// API-specific request handling
export class ApiRequest extends ServerRequest {
	constructor (req, res, db) {
		super(req, res, db)
		// immediately handle the request
		this.handle()
	}

	// Send JSON response using parent end() with JSON content type
	end (overrideData = undefined) {
		return super.end({
			contentType: 'application/json',
			override: overrideData
		})
	}

	// Main flow: parse route, validate and dispatch, then respond
	async handle () {
		this.parseRoute()
		const ok = this.splitRoute()
		if (!ok) return this.send404()
		try {
			const result = await this.useRouteController(this.routeParts)
			this.setData({ ok: true, data: result })
			this.setStatusCode(200)
		} catch (err) {
			this.setStatusCode(500)
			this.setData({ ok: false, error: String(err) })
		}
		return this.end()
	}

	// strip the `/api/` prefix and store the raw route
	parseRoute () {
		const raw = this.req.url || ''
		this.setRoute(raw.slice(5))
	}

	// split route into chunks and validate; expected form: <id>/<action>/<group>
	splitRoute () {
		const parts = (this.route || '').split('/').filter(Boolean)
		this.routeParts = parts
		if (!this.isValidRoute(parts)) return false
		return true
	}

	// call the controller on the db object: db[action](id, group)
	useRouteController (parts) {
		const [ id, action, group ] = parts
		if (!this.db) throw new Error('No db configured')
		const controller = this.db[action]
		if (typeof controller !== 'function') throw new Error(`Unknown action: ${action}`)
		return controller.call(this.db, id, group, this.data || {})
	}

	// validate route shape and allowed actions/groups
	isValidRoute (arr) {
		return (
			arr &&
			arr.length === 3 &&
			API_ACTIONS.includes(arr[1]) &&
			API_ACTION_GROUPS.includes(arr[2])
		)
	}

	// produce a 404 JSON response
	send404 () {
		this.setStatusCode(404)
		this.setData({ ok: false, error: `Route Not Found: /${this.route || ''}` })
		return this.end()
	}
}

// HTML and static file handling
export class HtmlRequest extends ServerRequest {
  constructor (req, res, db) {
    super(req, res, db)
    this.staticDir = resolve(__dirname, '..')
    this.handle()
  }

  handle () {
    const url = this.req.url || '/'

    // Handle root path - serve index.html
    if (url === '/') {
      this.serveFile('index.html')
      return
    }

    // Handle static files (if url starts with /assets, /js, /css etc)
    if (url.match(/^\/(assets|js|css|img)\//)) {
      this.serveFile(url.slice(1))
      return
    }

    // All other paths redirect to /?path=<url> for client routing
    if (!url.startsWith('/?')) {
			this.redirect(`/?path=${url}`)
      this.res.end()
      return
    }

    // Serve index.html for client-side routing (/?path=...)
    this.serveFile('index.html')
  }

  async serveFile(filepath) {
    try {
      const normalizedPath = join(this.staticDir, filepath)
      // Security check - ensure file is within staticDir
      if (!normalizedPath.startsWith(this.staticDir)) {
        return this.send403()
      }

      const content = await readFile(normalizedPath)
      const ext = extname(normalizedPath).toLowerCase()
      const contentType = MIME_TYPES[ext] || 'application/octet-stream'

      this.res.writeHead(200, { 'Content-Type': contentType })
      this.res.end(content)
    } catch (err) {
      if (err.code === 'ENOENT') {
        this.send404()
      } else {
        this.send500(err)
      }
    }
  }

  send403 () {
    this.res.writeHead(403, { 'Content-Type': 'text/html' })
    this.res.end('403 Forbidden')
  }

  send404 () {
    this.res.writeHead(404, { 'Content-Type': 'text/html' })
    this.res.end('404 Not Found')
  }

  send500 (err) {
    this.res.writeHead(500, { 'Content-Type': 'text/html' })
    this.res.end('500 Internal Server Error')
  }
}