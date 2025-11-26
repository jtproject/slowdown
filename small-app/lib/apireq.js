import { API_ACTION_GROUPS, API_ACTIONS } from '../config/options.js'
import { API_RULES } from '../config/rules.js'
import RESPONSE_CODES from '../config/status.js'
import { serializeForDatabase } from '../utils/data.js'
import { noIdError, noRouteError } from '../utils/error.js'
import ServerRequest from './req.js'
import { JSONResponse } from './res.js'

export default class ApiRequest extends ServerRequest {

	constructor (req, res, db) {
		super(req, res, db)
		this.req.on('end', () => this.handle())
	}

	async handle () {
		const response = new JSONResponse(this.res)
		const route = this.req.url || ''
		if (!this._isValidRoute(route.slice(5))) response.fail(404, noRouteError(route))




 
		try {
			const actionRules = API_RULES[this.routeParts[1]]._rules
			const groupRules = API_RULES[this.routeParts[1]][this.routeParts[2]]
			const methods = actionRules.ALLOWED_METHODS
			if (!methods.includes(this.req.method)) {
				return this._sendError(405, 'Can\'t do this method here!')
			}
			const body = this.body
			switch (groupRules.ID) {
				case 'seq':
					if (!body.seq) return this._sendError(400, response.fail(400, noIdError()))
				case 'seqs':
				default:
					break
			}
			serializeForDatabase(body)

			const result = this.db.dispatch(...this.routeParts, this.body)
			console.log(result)
			if (result.ok === false) {
				return this._sendError(result.code, result.error?.message ?? 'Unknown error occured in Controller.')
			}
			this._setData(result)
			this._setStatusCode(result.code)
			return this.end()
		} 
		catch (err) {
			return this._sendError(500, err.message)
		}
	}

	// splitRoute () {
	// 	this.routeParts = parts
	// 	if (!this._isValidRoute(parts)) return false
	// 	return true
	// }

	_isValidRoute (route) {
		const splitRoute = route.split('/').filter(Boolean)
		console.log(splitRoute)
		
		
		return (false
			// arr &&
			// arr.length === 3 &&
			// API_ACTIONS.includes(arr[1]) &&
			// API_ACTION_GROUPS.includes(arr[2])
		)
	}

	_setContentType () {
		this.headers['Content-Type'] = 'application/json'
	}

	_sendError(code, message) {
		this._setStatusCode(code)
		this._setData({ ok: false, code, status: RESPONSE_CODES[code], error: message })
		return this.end()
	}

	_send404 () {
		this._sendError(404, `Route not found: /${ String(this.route) }`)
	}
}