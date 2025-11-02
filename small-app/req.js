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

class ServerRequest {
	constructor(req, res, db = null) {
		this.req = req
		this.res = res
		this.statusCode = 500
		this.data = null
		if (db) this.db = db
		this.do()
	}
	
	do() {
		return
	}

	setRoute(route) {
		this.route = route
	}

	setData(data) {
		this.data = data
	}

	setStatusCode(code) {
		this.statusCode = code
	}

	redirect(location) {
		this.setStatusCode(302)
		this.setData({ Location: location })
	}
}

export class ApiRequest extends ServerRequest {
	constructor(req, res, db) {
		super(req, res, db)
	}

	do() {
		this.parseRoute()
		this.splitRoute()		
		this.end()
	}

	end() {
		this.res.writeHead(this.statusCode, { 'Content-Type': 'application/json' })
		this.res.end(this.data)
	}

	parseRoute() {
		this.setRoute(this.req.url.slice(5))
	}

	splitRoute() {
		const splitRoute = this.route.split('/')
		// validate route existance
		if (!this.isValidRoute(splitRoute)) return this.set404()
		const data = this.db.read('sample')
		this.setData(JSON.stringify({ data }))
		// this.data = JSON.stringify({hey: 'there'})
	}

	isValidRoute(arr) {
		if (
			arr.length === 3 &&
			API_ACTIONS.includes(arr[1]) &&
			API_ACTION_GROUPS.includes(arr[2])
		) return true
		return false
	}

	set404() {
		this.statusCode = 404
		this.data = JSON.stringify({
			error: `Route Not Found [/${ this.route }`
		})
	}
}

export class HttpRequest extends ServerRequest {
	constructor(req, res) {
		super(req, res)

		if (req.url !== '/' 
			&& !req.url.startsWith('/?')) {
			res.writeHead(
				302, 
				{ Location: `/?path=${ req.url }` }
			)
		}
	}

	do() {
		this.setRoute(route)

	}

	parseRoute(route) {
	}

}