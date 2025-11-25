import { API_ACTION_GROUPS, API_ACTIONS } from '../config/options.js'
import { API_RULES } from '../config/rules.js'
import RESPONSE_CODES from '../config/status.js'
import { serializeForDatabase } from '../utils/data.js'
import ServerRequest from './req.js'

export default class ApiRequest extends ServerRequest {

	constructor (req, res, db) {
		super(req, res, db)
		this.req.on('end', () => this.handle())
	}

	async handle () {
		this.parseRoute()
		const ok = this.splitRoute()
		if (!ok) return this._send404()
		try {
			const actionRules = API_RULES[this.routeParts[1]]._rules
			const groupRules = API_RULES[this.routeParts[1]][this.routeParts[2]]
			const methods = actionRules._rules.ALLOWED_METHODS
			if (!methods.includes(this.req.method)) {
				return this._sendError(405, 'Can\'t do this method here!')
			}
			const body = this.body
			switch (groupRules.ID) {
				case 'seq':
					if (!body.seq) return //error
				case 'seqs':
				default:
					return
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

	_isValidRoute (arr) {
		return (
			arr &&
			arr.length === 3 &&
			API_ACTIONS.includes(arr[1]) &&
			API_ACTION_GROUPS.includes(arr[2])
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