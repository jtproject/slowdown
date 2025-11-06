
/*
	Base request wrapper that holds the http `req` and `res` objects and provides common helpers for subclasses
*/
export default class ServerRequest {
	constructor (req, res, db = null) {
		this.req = req
		this.res = res
		this.db = db || null
		this.statusCode = 200
		this.headers = {
			'Content-Type': 'application/json'
		}
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
		this.headers.Location = location
		this.end()
	}

	end (overrideData = undefined) {
		let body = overrideData || this.data
		if (this.headers['Content-Type'] === 'application/json' && typeof body !== 'string') {
			body = JSON.stringify(body || {})
		}
		this.res.writeHead(this.statusCode, this.headers)
		this.res.end(body)
	}
}