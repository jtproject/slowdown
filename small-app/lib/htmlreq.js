import ServerRequest from './req.js'
import { dirname, extname, join, resolve } from "path"
import { fileURLToPath } from "url"
import { MIME_TYPES } from '../config/options.js'
import { readFile } from 'fs/promises'

// Get current directory path (ES Module equivalent of __dirname)
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export default class HtmlRequest extends ServerRequest {
  constructor (req, res, db) {
    super(req, res, db)
    this.staticDir = resolve(__dirname, '..')
    this.handle()
  }

  handle () {
    const url = this.req.url || '/'
    // Handle static files (if url starts with /assets, /js, /css etc)
    if (url.match(/^\/(assets|js|css|img)\//)) {
      this.serveFile(url.slice(1))
      return
    }
    if (!url.startsWith('/?') && url !== '/'){
			this.redirect(`/?path=${url}`)
			return
    }
    this.serveFile('index.html')
  }

  async serveFile(filepath) {
    try {
      const normalizedPath = join(this.staticDir, filepath)
      if (!normalizedPath.startsWith(this.staticDir)) {
        return this.send403()
      }
      this.data = await readFile(normalizedPath)
      this.headers['Content-Type'] = MIME_TYPES[
				extname(normalizedPath).toLowerCase()
			] || 'application/octet-stream'
			this.end()
    } catch (err) {
      if (err.code === 'ENOENT') {
        this.send404()
      } else {
        this.send500(err)
      }
    }
  }

	_handle () {
		this.res.end('HTML')
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