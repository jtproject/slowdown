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

	sendData () {

	}

	sendError () {
		
	}
}

export class HTMLResponse extends Response {

	constructor (res) {
		super(res)
		this._setContentType('text/html')
	}
}