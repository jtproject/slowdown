import { ALLOWED_METHODS, API_ACTION_GROUPS, API_ACTIONS } from '../config/options.js'
import RESPONSE_CODES from '../config/status.js'
import ServerRequest from './req.js'

export default class ApiRequest extends ServerRequest {

	constructor (req, res, db) {
		super(req, res, db)
		this.handle()
	}

	async handle () {
		this.parseRoute()
		const ok = this.splitRoute()
		if (!ok) return this._send404()
		try {
			const result = await this.useRouteController(this.routeParts)
			this._setData({ ok: true, code: 200, status: RESPONSE_CODES[200], data: result })
			this._setStatusCode(200)
		} catch (err) {
			return this._sendError(500, err)
		}
		return this.end()
	}

	parseRoute () {
		const raw = this.req.url || ''
		this._setRoute(raw.slice(5))
	}

	splitRoute () {
		const parts = (this.route || '').split('/').filter(Boolean)
		this.routeParts = parts
		if (!this._isValidRoute(parts)) return false
		return true
	}

	// call the controller on the db object: db[action](id, group)
	async useRouteController (parts) {
		const [ id, action, group ] = parts
		if (!this.db) throw new Error('No db configured')
		const controller = this.db[action]
		if (typeof controller !== 'function') throw new Error(`Unknown action: ${action}`)
		console.log(this.req.method)
		console.log(ALLOWED_METHODS[action].includes(this.req.method))
		if (ALLOWED_METHODS[action].includes(this.req.method)) {
			let body = ''
			this.req.on('data', (chunk) => {
				body += chunk.toString('utf8')
			})
			this.req.on('end', async () => {
				const response = await controller.call(this.db, id, group, body)
				if (response.error) return this._sendError(response.error.code, response.error.message)
				return response
			})
		}
		else return this._sendError(405, `Only ${ ALLOWED_METHODS[action].join(' or ') } method(s) are allowed in '${ action }' routes.`)
	}

	// validate route shape and allowed actions/groups
	_isValidRoute (arr) {
		return (
			arr &&
			arr.length === 3 &&
			API_ACTIONS.includes(arr[1]) &&
			API_ACTION_GROUPS.includes(arr[2])
		)
	}

	_sendError(code, message) {
		this._setStatusCode(code)
		this._setData({ ok: false, code, status: RESPONSE_CODES[code], error: message })
		this.end()
	}

	_send404 () {
		this._sendError(404, `Route not found: /${ String(this.route) }`)
	}
}