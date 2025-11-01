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
	constructor(req, res) {
		this.req = req
		this.res = res
		this.parseRoute()
		this.splitRoute()
	}

	setRoute(route) {
		this.route = route
	}

	parseRoute(...x) {
		'parseRoute function not found'
	}
	
	splitRoute(...x) {
		'splitRoute function not found'
	}
}

export class ApiRequest extends ServerRequest {
	constructor(req, res) {
		super(req, res)
	}

	parseRoute() {
		this.setRoute(this.req.url.slice(5))
	}

	splitRoute() {
		const splitRoute = this.route.split('/')
		console.log(splitRoute)
		// validate route existance
		if (splitRoute.length !== 3 ||
			!API_ACTIONS.includes(splitRoute[1]) ||
			!API_ACTION_GROUPS.includes(splitRoute[2])
		) return this.send404()
	}
	
	send404() {
		this.sendJson({
			status: 404,
			message: `${ this.route } - Route Not Found`
		}, 404)
	}
	
	sendJson(data, statusCode) {
		this.res.writeHead(statusCode, { 'Content-Type': 'application/json' })
		this.res.end(JSON.stringify(data))
	}
}

export class HttpRequest extends ServerRequest {
	constructor(req, res) {
		super(req, res)
		this.res.end('hi')
	}
}