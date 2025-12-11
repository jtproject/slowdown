import { BLANK_MODEL } from "../config/objects.js"
import { valueError, queryError } from "../utils/error.js"
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
		if (!filters || typeof filters !== "object") return entries

		let result = [...entries]

		// Identity filters
		const ids = []
		if (filters._id) ids.push(filters._id)
		if (filters._ids) ids.push(...filters._ids)

		const seqs = []
		if (filters._seq !== undefined) seqs.push(filters._seq)
		if (filters._seqs) seqs.push(...filters._seqs)

		if (ids.length > 0) {
			result = result.filter(e => ids.includes(e._id))
		}

		if (seqs.length > 0) {
			result = result.filter(e => seqs.includes(e._seq))
		}

		// Field matching (non-identity keys)
		Object.entries(filters).forEach(([key, val]) => {
			if (key.startsWith("_")) return
			result = result.filter(e => e[key] === val)
		})

		return result
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

	_err400(msg) {
		return { code: 400, error: valueError(msg) }
	}

	_err404() {
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

	create(modelName, group, data) {
		const model = this._getModel(modelName)

		if (group === "one") {
			const entry = this._buildEntry(model, data)
			this._insertEntry(model, entry)
			this._write(model)
			return this._ok(201, entry)
		}

		if (group === "many") {
			if (!Array.isArray(data)) {
				return this._err400("Data must be an array for 'many'.")
			}
			const entries = data.map(d => {
				const e = this._buildEntry(model, d)
				this._insertEntry(model, e)
				return e
			})
			this._write(model)
			return this._ok(201, entries)
		}

		return this._invalidGroup(group)
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