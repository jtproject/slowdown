import { API_ACTION_GROUPS, API_ACTIONS } from '../config/options.js'
import { API_RULES } from '../config/rules.js'
import RESPONSE_CODES from '../config/status.js'
import { serializeForDatabase } from '../utils/data.js'
import { noIdError, noRouteError, syntaxError } from '../utils/error.js'
import ServerRequest from './req.js'
import { JSONResponse } from './res.js'

export default class ApiRequest extends ServerRequest {

	constructor (req, res, db) {
		super(req, res, db)
		this.req.on('end', () => this.handle())
	}

	async handle () {
		const response = new JSONResponse(this.res)

		const routeParts = this.req.url.slice(5).split('/').filter(Boolean)

		const validate = this._validateRoute(routeParts)
		if (validate.error) return response.fail(404, validate.error)

		const allow = this._allowRoute(routeParts[1])
		if (allow.error) return response.fail(405, allow.error)

		serializeForDatabase(this.body)
		return response.send(200, this.body)


 
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

	_allowRoute (action) {
		action = action.toLowerCase()
		const allowed = API_RULES[action]._rules.ALLOWED_METHODS
		if (!allowed.includes(this.req.method)) {
			return { error: syntaxError(`Only ${ allowed.join(', ') } methods can be used on '${ action }' routes.`) }
		}
		return true
	}

	_validateRoute (splitRoute) {
		const error = noRouteError(`api/${ splitRoute.join('/') }`)
		if (splitRoute.length !== 3) {
			error.tips.push('Use /api/<model>/<action>/<group> format.')
		}
		if (!API_ACTIONS.includes(splitRoute[1])) {
			error.tips.push(`'${ splitRoute[1] }' is not a valid action. Use ${ API_ACTIONS.join(', ')} only.`)
		}
		if (!API_ACTION_GROUPS.includes(splitRoute[2])) {
			error.tips.push(`'${ splitRoute[2] }' is not a valid group. Use ${ API_ACTION_GROUPS.join(', ')} only.`)
		}
		if (error.tips.length > 0) return { error }
		return true
	}

	// _setContentType () {
	// 	this.headers['Content-Type'] = 'application/json'
	// }

	// _sendError(code, message) {
	// 	this._setStatusCode(code)
	// 	this._setData({ ok: false, code, status: RESPONSE_CODES[code], error: message })
	// 	return this.end()
	// }

	// _send404 () {
	// 	this._sendError(404, `Route not found: /${ String(this.route) }`)
	// }
}