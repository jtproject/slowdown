import ServerRequest from './req.js'
import { JSONResponse } from './res.js'
import { API_ACTION_GROUPS, API_ACTIONS, MODEL_BUILTIN_IDENTIFIERS } from '../config/options.js'
import { API_RULES } from '../config/rules.js'
import { serializeForDatabase } from '../utils/data.js'
import { locationError, noRouteError, syntaxError } from '../utils/error.js'

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
    const validation = this._validateRoute(routeParts)

    if (validation.error) return response.fail(404, validation.error)

    const allowResult = this._checkAllowedMethod(routeParts.action)
    if (allowResult.error) return response.fail(405, allowResult.error)

    const serialized = this._serializeBody(routeParts.action, routeParts.group)
    if (serialized.error) return response.fail(serialized.code, serialized.error)

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
    const allowed = API_RULES[action]._rules.ALLOWED_METHODS

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

  _getRules (action, group) {
    const info = API_RULES[action][group] || {}
    const rules = info._rules || {}
    return [info, rules]
  }

  _serializeBody (action, group) {
    const [info, rules] = this._getRules(action, group)

    if (rules.FAIL) {
      return {
        error: locationError(rules.FAIL.message),
        code: rules.FAIL.code
      }
    }

    const identifiers = this._extractIdentifiers(info.ID || '')
    this._mergeBodyData(identifiers, info.DATA)

    serializeForDatabase(identifiers)

    return identifiers
  }

  /*
    ----------------------------
    BODY DATA MERGING
    ----------------------------
  */

  _mergeBodyData (target, filter) {
    if (filter === 'none') return

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

  /*
    ----------------------------
    IDENTIFIER EXTRACTION
    ----------------------------
  */

  _extractIdentifiers (filterString) {
    const identifiers = this._buildIdentifierList()
    const filterKeys = filterString.split('/').filter(Boolean)

    const filtered = {}
    filterKeys.forEach(key => {
      if (key in identifiers) filtered[key] = identifiers[key]
    })

    return filtered
  }

  _buildIdentifierList () {
    const [seqs, ids] = this._getSeqsAndIds()

    const seq = this.body.seq !== undefined
      ? this.body.seq
      : (seqs[0] ?? null)

    const id = this.body.id !== undefined
      ? this.body.id
      : (ids[0] ?? null)

    return {
      seq,
      id,
      seqs: seq !== null ? [...new Set([seq, ...seqs])] : seqs,
      ids: id !== null ? [...new Set([id, ...ids])] : ids
    }
  }

  _getSeqsAndIds () {
    const seqs = Array.isArray(this.body.seqs) ? [...this.body.seqs] : []
    const ids = Array.isArray(this.body.ids) ? [...this.body.ids] : []
    return [seqs, ids]
  }
}