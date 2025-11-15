export default class ServerRequest {

	constructor (req, res, db = null) {
		this.data = null
		this.error = null
		this.req = req
		this.res = res
		this.db = db || null
		this._setStatusCode(500)
		this._collectBodyData()
		this.headers = {
			'Content-Type': 'application/json'
		}
	}
	
	_collectBodyData () {
		this.body = ''
		
		this.req.on('data', (chunk) => {
			this.body += chunk.toString('utf8')
		})
		
		this.req.on('end', () => {
			if (this.body) {
				try {
					this.body = JSON.parse(this.body)
				} catch (err) {
					this.error = new Error('Failed to parse request body as JSON')
				}
			}
		})

	}


	_setRoute (route) {
		this.route = route
	}

	_setData (data) {
		this.data = data
	}
	
	// Convenience: set HTTP status code
	_setStatusCode (code) {
		this.statusCode = code
	}

	// Redirect helper: sets 302 and location header
	redirect (location) {
		this._setStatusCode(302)
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