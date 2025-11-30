export default class ServerRequest {

	constructor (req, res, db = null) {
		this.req = req
		this.res = res
		this.db = db || null
		this._collectBodyData()
	}
	
	_collectBodyData () {
		this.body = ''
		
		this.req.on('data', (chunk) => {
			this.body += chunk.toString('utf8')
		})
		
		this.req.on('end', () => {
			if (this.body) {
				try {
					this.body = JSON.parse(this.body)
				} catch (err) {
					this.error = new Error('Failed to parse request body as JSON')
				}
			}
		})
	}
}