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
		const response = {
			...this._responseTemplate(true, code),
			data
		}
		this._end(code, response)
	}

	fail (code, error) {
		const response = {
			...this._responseTemplate(false, code),
			error
		}
		this._end(code, response)
	}

	_end (code, response) {
		this.res.writeHead(code, this.headers)
		this.res.end(JSON.stringify(response))
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