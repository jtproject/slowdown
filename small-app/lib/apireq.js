import ServerRequest from './req.js'
import { JSONResponse } from './res.js'
import { API_ACTION_GROUPS, API_ACTIONS, MODEL_BUILTIN_IDENTIFIERS} from '../config/options.js'
import { API_RULES } from '../config/rules.js'
import { serializeForDatabase } from '../utils/data.js'
import { locationError, noRouteError, syntaxError } from '../utils/error.js'

export default class ApiRequest extends ServerRequest {

	constructor (req, res, db) {
		super(req, res, db)
	}
	
	_getRules (action, group) {
		const info = API_RULES[action][group] || {}
		const rules = info._rules || {}
		return [info, rules]
	}

	_serialize (action, group) {
		const [info, rules] = this._getRules(action, group)
		if (rules.FAIL) return { error: locationError(rules.FAIL.message), code: rules.FAIL.code }
		const object = this._getIdentifiers(info.ID || '')
		this._appendBodyData(object, info.DATA)
		serializeForDatabase(object)
		return object
	}

	_stripIdentifiers (object) {
		const filteredObject = {}
		Object.keys(object).forEach(key => {
			if (
				!MODEL_BUILTIN_IDENTIFIERS.includes(key)
				&& !MODEL_BUILTIN_IDENTIFIERS.includes(key.slice(1))
			) filteredObject[key] = object[key]
		})
		return filteredObject
	}

	_appendBodyData (object, filter) {
		if (filter === 'none') return
		const body = this._stripIdentifiers(this.body)
		Object.keys(body).forEach(key => object[key] = body[key])
	}

	_seqsAndIds () {
		return [
			Array.isArray(this.body.seqs) ? this.body.seqs : [],
			Array.isArray(this.body.ids) ? this.body.ids : []
		]
	}

	_identifierList () {
		const [seqs, ids] = this._seqsAndIds()
		return {	
			seq: this.body.seq || seqs[0] || null, 
			id: this.body.id || ids[0] || null, 
			seqs: this.body.seq ? [...seqs, this.body.seq] : seqs, 
			ids: this.body.id ? [...ids, this.body.id] : ids 
		}
	}

	_getIdentifiers (filter) {
		const filteredIdentifiers = {}
		const identifiers = this._identifierList()
		filter.split('/').filter(Boolean).forEach(value => filteredIdentifiers[value] = identifiers[value])
		return filteredIdentifiers
	}

	async _handle () {
		const response = new JSONResponse(this.res)

		const routeParts = this.req.url.slice(5).split('/').filter(Boolean)

		const validate = this._validateRoute(routeParts)
		if (validate.error) return response.fail(404, validate.error)

		const allow = this._allowRoute(routeParts[1])
		if (allow.error) return response.fail(405, allow.error)

		const serializedBody = this._serialize(...routeParts.slice(1))
		if (serializedBody.error) return response.fail(serializedBody.code, serializedBody.error)
	
		const result = this.db.dispatch(...routeParts, serializedBody)
		if (result.error) return response.fail(result.code, result.error) 
		return response.send(result.code, result.data)
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
}