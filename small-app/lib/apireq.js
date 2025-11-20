import { API_ACTION_GROUPS, API_ACTIONS } from '../config/options.js'
import RESPONSE_CODES from '../config/status.js'
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
			const result = this.db.dispatch(...this.routeParts, this.body)
			if (result.ok === false) return this._sendError(result.code, result.error?.message ?? 'Unknown error occured in Controller.')
			console.log(result)
			this._setData(result)
			this._setStatusCode(result.code)
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