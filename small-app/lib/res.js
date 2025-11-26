import RESPONSE_CODES from "../config/status.js"

class Response {

	constructor (res) {
		this.res = res
		this.headers = {}
	}

	_setContentType (type) {
		this.headers['Content-Type'] = type
	}
}

export class JSONResponse extends Response {

	constructor (res) {
		super(res)
		this._setContentType('application/json')
	}

	send (code, data) {
		return {
			...this._responseTemplate(true, code),
			data
		}
	}

	fail (code, error) {
		return {
			...this._responseTemplate(false, code),
			error
		}
	}

	_responseTemplate (ok, code) {
		return {
			ok,
			code,
			status: RESPONSE_CODES[code]
		}
	}
}

export class HTMLResponse extends Response {

	constructor (res) {
		super(res)
		this._setContentType('text/html')
	}

	sendData () {

	}

	sendError () {

	}
}