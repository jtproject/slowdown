import { API_ACTION_GROUPS, API_ACTIONS } from './options.js'
import ServerRequest from './req.js'

export default class ApiRequest extends ServerRequest {
	constructor (req, res, db) {
		super(req, res, db)
		this.handle()
	}

	async handle () {
		this.parseRoute()
		const ok = this.splitRoute()
		if (!ok) return this.send404()
		try {
			const result = await this.useRouteController(this.routeParts)
			this.setData({ ok: true, data: result })
			this.setStatusCode(200)
		} catch (err) {
			this.setStatusCode(500)
			this.setData({ ok: false, error: String(err) })
		}
		return this.end()
	}

	parseRoute () {
		const raw = this.req.url || ''
		this.setRoute(raw.slice(5))
	}

	splitRoute () {
		const parts = (this.route || '').split('/').filter(Boolean)
		this.routeParts = parts
		if (!this.isValidRoute(parts)) return false
		return true
	}

	// call the controller on the db object: db[action](id, group)
	useRouteController (parts) {
		const [ id, action, group ] = parts
		if (!this.db) throw new Error('No db configured')
		const controller = this.db[action]
		if (typeof controller !== 'function') throw new Error(`Unknown action: ${action}`)
		return controller.call(this.db, id, group, this.data || {})
	}

	// validate route shape and allowed actions/groups
	isValidRoute (arr) {
		return (
			arr &&
			arr.length === 3 &&
			API_ACTIONS.includes(arr[1]) &&
			API_ACTION_GROUPS.includes(arr[2])
		)
	}

	// produce a 404 JSON response
	send404 () {
		this.setStatusCode(404)
		this.setData({ ok: false, error: `Route Not Found: /${this.route || ''}` })
		return this.end()
	}
}