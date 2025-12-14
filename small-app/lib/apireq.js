import ServerRequest from './req.js'
import { JSONResponse } from './res.js'
import { API_ACTION_GROUPS, API_ACTIONS, MODEL_BUILTIN_IDENTIFIERS } from '../config/options.js'
import { API_RULES } from '../config/rules.js'
import { serializeForDatabase } from '../utils/data.js'
import { locationError, noRouteError, syntaxError } from '../utils/error.js'
import { extractIdentifiers } from '../utils/identifiers.js'

export default class ApiRequest extends ServerRequest {

  constructor ( req, res, db ) {
    super(req, res, db)
  }

  /*
    ----------------------------
    ROUTE HANDLING
    ----------------------------
  */

  async _handle () {
    const response = new JSONResponse(this.res)
    const routeParts = this._parseRoute(this.req.url)
		// check for valid API route
    const validation = this._validateRoute(routeParts)
    if (validation.error) return response.fail(404, validation.error)
		// check req method with route
    const allowResult = this._checkAllowedMethod(routeParts.action)
    if (allowResult.error) return response.fail(405, allowResult.error)
		// prepare body data to rule specs
    const serialized = this._serializeBody(routeParts.action, routeParts.group)
    if (serialized.error) return response.fail(serialized.code, serialized.error)
console.log(serialized)
    const result = this.db.dispatch(
      routeParts.model,
      routeParts.action,
      routeParts.group,
      serialized
    )

    if (result.error) return response.fail(result.code, result.error)

    return response.send(result.code, result.data)
  }

  _parseRoute (url) {
    // Expects /api/<model>/<action>/<group>
    const split = url.slice(5).split('/').filter(Boolean)

    return {
      raw: split,
      model: split[0],
      action: split[1],
      group: split[2]
    }
  }

  _checkAllowedMethod (action) {
    action = action.toLowerCase()
    const allowed = API_RULES[action].ALLOWED_METHODS

    if (!allowed.includes(this.req.method)) {
      return { error: syntaxError(`Only ${ allowed.join(', ') } methods can be used on '${ action }' routes.`) }
    }

    return true
  }

  _validateRoute ({ raw, model, action, group }) {
    const error = noRouteError(`api/${ raw.join('/') }`)

    if (raw.length !== 3) {
      error.tips.push('Use /api/<model>/<action>/<group> format.')
    }

    if (!API_ACTIONS.includes(action)) {
      error.tips.push(`'${ action }' is not a valid action. Use ${ API_ACTIONS.join(', ') } only.`)
    }

    if (!API_ACTION_GROUPS.includes(group)) {
      error.tips.push(`'${ group }' is not a valid group. Use ${ API_ACTION_GROUPS.join(', ') } only.`)
    }

    if (error.tips.length > 0) return { error }

    return true
  }

  /*
    ----------------------------
    RULES & SERIALIZATION
    ----------------------------
  */

  _serializeBody (action, group) {
    const rules = API_RULES[action] || {}
		if (rules.FAIL && rules.FAIL[group]) {
			return {
        error: locationError(rules.FAIL[group].message),
        code: rules.FAIL.code
      }
    }
		const identifiers = rules.ID
			.split('/')
			.filter(Boolean)
			.map(i => (
				group === 'many' ? i + 's' : i
			))
    const data = extractIdentifiers(this.body, identifiers)
    this._mergeBodyData(data, rules.DATA)
    serializeForDatabase(data)
    return data
  }

  /*
    ----------------------------
    BODY DATA MERGING
    ----------------------------
  */

  _mergeBodyData (target, filter) {
    if (!filter) return

    const body = this._stripReservedFields(this.body)
    Object.keys(body).forEach(key => {
      target[key] = body[key]
    })
  }

  _stripReservedFields (object) {
    const result = {}

    Object.keys(object).forEach(key => {
      const isReserved =
        MODEL_BUILTIN_IDENTIFIERS.includes(key) ||
        MODEL_BUILTIN_IDENTIFIERS.includes(key.slice(1))

      if (!isReserved) result[key] = object[key]
    })

    return result
  }
}