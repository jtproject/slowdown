import { BLANK_MODEL } from "../config/objects.js"
import { MODEL_BUILTIN_IDENTIFIERS } from "../config/options.js"
import { valueError, queryError, unknownError } from "../utils/error.js"
import dotenv from "dotenv"

dotenv.config()
const multiplier = process.env.BASE_36_MULTIPLIER
const subtractor = process.env.BASE_36_SUBTRACTOR

const base36 = () =>
	(Date.now() * multiplier - subtractor).toString(36)

export default class Controller {

	constructor(filer, modeler) {
		this._filer = filer
		this._modeler = modeler
	}

	/* ----------------------------------------------------------
	 *  INTERNAL HELPERS
	 * -------------------------------------------------------- */

	_getModel(name) {
		let model = this._modeler.getModel(name)
		if (!model) {
			this._modeler.newModel(name)
			this._filer.write(name, BLANK_MODEL(name))
			model = this._modeler.getModel(name)
		}
		return model
	}

	_write(model) {
		this._filer.write(model.name, model)
	}

	/* ----------------------------------------------------------
	 *  ENTRY CREATION
	 * -------------------------------------------------------- */

	_buildEntry(model, data) {
		const now = new Date()
		return {
			...data,
			_id: base36(),
			_seq: model.index++,
			_created: now,
			_updated: now
		}
	}

	_insertEntry(model, entry) {
		model.data.push(entry)
		model.count = model.data.length
	}

	/* ----------------------------------------------------------
	 *  FILTERING
	 * -------------------------------------------------------- */

	_filter(entries, filters) {
		const filtered = []
		MODEL_BUILTIN_IDENTIFIERS.forEach(value => {
			value = '_' + value
			const single = value.endsWith('s') ? value.slice(0, value.length - 1) : value
			if (value in filters) {
				if (!Array.isArray(filters[value])) {
					filters[value] = [filters[value]]
				}
				filters[value].forEach(v => {
					const result = entries.filter(entry => entry[single] === v)
					if (result.length > 0) filtered.push(...result)
				})
				delete filters[value]
			}
		})
		return filtered
	}

	/* ----------------------------------------------------------
	 *  UPDATING
	 * -------------------------------------------------------- */

	_applyUpdate(entries, updates) {
		const now = new Date()
		entries.forEach(entry => {
			Object.entries(updates).forEach(([key, val]) => {
				entry[key] = val
			})
			entry._updated = now
		})
	}

	/* ----------------------------------------------------------
	 *  ERROR HELPERS
	 * -------------------------------------------------------- */

	_err400 (msg) {
		return { code: 400, error: valueError(msg) }
	}

	_err500 () {
		return { code: 500, error: unknownError() }
	}

	_err404 () {
		return { code: 404, error: queryError("No matching records found.") }
	}

	_invalidGroup(group) {
		return this._err400(`Invalid group '${group}'. Use one | many | all.`)
	}

	_ok(code, data) {
		return { code, data }
	}

	/* ----------------------------------------------------------
	 *  PUBLIC METHODS
	 * -------------------------------------------------------- */

	_control (group, callbacks) {
		if (callbacks[group]) return callbacks[group]()
		return this._err500()
	}

	create(modelName, group, data) {
		const model = this._getModel(modelName)
		const groups = {
			one: () => {
				const entry = this._buildEntry(model, data)
				this._insertEntry(model, entry)
				this._write(model)
				return this._ok(201, entry)
			},
			many: () => {
				if (!Array.isArray(data)) data = Object.values(data)
				const entries = data.map(d => {
					const e = this._buildEntry(model, d)
					this._insertEntry(model, e)
					return e
				})
				this._write(model)
				return this._ok(201, entries)
			}
		}
		return this._control(group, groups)
	}

	read(modelName, group, filters) {
		const model = this._getModel(modelName)

		if (group === "all") {
			return this._ok(200, model.data)
		}

		const matches = this._filter(model.data, filters)
		if (matches.length === 0) return this._err404()

		if (group === "one") {
			return this._ok(200, matches[0])
		}

		if (group === "many") {
			return this._ok(200, matches)
		}

		return this._invalidGroup(group)
	}

	update(modelName, group, payload) {
		const model = this._getModel(modelName)

		const { filters, updates } = payload
		if (!updates || typeof updates !== "object") {
			return this._err400("Updates required.")
		}

		if (group === "all") {
			this._applyUpdate(model.data, updates)
			this._write(model)
			return this._ok(200, { updated: model.data.length })
		}

		const matches = this._filter(model.data, filters)
		if (matches.length === 0) return this._err404()

		if (group === "one") {
			this._applyUpdate([matches[0]], updates)
			this._write(model)
			return this._ok(200, matches[0])
		}

		if (group === "many") {
			this._applyUpdate(matches, updates)
			this._write(model)
			return this._ok(200, { updated: matches.length })
		}

		return this._invalidGroup(group)
	}

	delete(modelName, group, identifiers) {
		const model = this._getModel(modelName)

		if (group === "all") {
			const count = model.data.length
			model.data = []
			model.count = 0
			this._write(model)
			return this._ok(202, { deleted: 'all', count })
		}

		const matches = this._filter(model.data, identifiers)
		if (matches.length === 0) return this._err404()

		if (group === "one") {
			const id = matches[0]._id
			model.data = model.data.filter(e => e._id !== id)
			this._write(model)
			return this._ok(202, { deleted: id, count: 1 })
		}

		if (group === "many") {
			const ids = new Set(matches.map(e => e._id))
			const count = ids.size
			model.data = model.data.filter(e => !ids.has(e._id))
			this._write(model)
			return this._ok(202, { deleted: Array.from(ids).join(', ') ,count })
		}

		return this._invalidGroup(group)
	}
}