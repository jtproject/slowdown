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
		// default status and body
		this.statusCode = 200
		this.data = null
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

	// Redirect helper: sets 302 and location header via response body
	redirect (location) {
		this.setStatusCode(302)
		// store redirect location as object so end() can format headers/body
		this.setData({ Location: location })
	}

	// Send JSON response. Ensures proper header and stringified payload
	end (overrideData = undefined) {
		const payload = typeof overrideData !== 'undefined' ? overrideData : this.data
		const body = typeof payload === 'string' ? payload : JSON.stringify(payload || {})
		// set content-type and status then send
		this.res.writeHead(this.statusCode, { 'Content-Type': 'application/json' })
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

	// Main flow: parse route, validate and dispatch, then respond
	async handle () {
		this.parseRoute()
		const ok = this.splitRoute()
		if (!ok) return this.set404()
		// dispatch to controller and capture result (supports promises)
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
	// supports synchronous or promise-returning controllers
	useRouteController (parts) {
		const [ id, action, group ] = parts
		if (!this.db) throw new Error('No db configured')
		const controller = this.db[action]
		if (typeof controller !== 'function') throw new Error(`Unknown action: ${action}`)
		return controller.call(this.db, id, group)
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
	set404 () {
		this.setStatusCode(404)
		this.setData({ ok: false, error: `Route Not Found: /${this.route || ''}` })
		return this.end()
	}
}

// Generic HTTP request handling (non-API)
export class HttpRequest extends ServerRequest {
	constructor (req, res, db) {
		super(req, res, db)
		// perform any immediate routing/redirects
		this.handle()
	}

	handle () {
		// redirect non-root requests to the client-side router
		const url = this.req.url || ''
		if (url !== '/' && !url.startsWith('/?')) {
			this.setStatusCode(302)
			// send location in headers via end()
			this.res.writeHead(302, { Location: `/?path=${url}` })
			this.res.end()
			return
		}
		// for root or index requests, respond with a small json confirmation
		this.setStatusCode(200)
		this.setData({ ok: true, path: url })
		return this.end()
	}
}