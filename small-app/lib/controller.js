import { BLANK_API_RESPONSE, BLANK_MODEL } from "../config/objects.js"
import RESPONSE_CODES from "../config/status.js"
import { getIdentifiers, parseSeqNumbers, serializeForDatabase } from "../utils/data.js"

export default class Controller {

	constructor (filer, modeler) {
		this._filer = filer
		this._modeler = modeler
		this.response = BLANK_API_RESPONSE()
	}

	/*
	 * === response methods */

	_dispatch (ok, code) {
		this.response.ok = ok
		this.response.code = code
		this.response.status = RESPONSE_CODES[code]
		return this.response
	}

	_sendError (error, code = 500) {
		delete this.response.data
		this.response.error = error
		return this._dispatch(false, code)
	}

	_sendData (data, code = 200) {
		delete this.response.error
		this.response.data = data
		return this._dispatch(true, code)
	}

	_createEntry (model, data) {
		if (Array.isArray(data)) {
			data = data[0]
			console.warn('Array sent to /one route.')
		}
		const timestamp = new Date()
		const entry = {
			...data,
			_id: 'coming-soon',
			_seq: model.index,
			_created: timestamp,
			_updated: timestamp
		}

		model.data.push(entry)
		model.index++
		model.count = model.data.length
		return entry
	}

	_writeFile (model) {
		this._filer.write(model.name, model)
	}

	_getTarget (modelName) {
		let target = this._modeler.getModel(modelName)
		if (!target) {
			this._modeler.new(modelName)
			this._filer.write(modelName, BLANK_MODEL)
			target = this._modeler.getModel(modelName)
		}
		return target
	}
	
	_getTargetData (modelName) {
		return this._getTarget(modelName).data
	}
	
	_filterData (data, filters) {
		if (!filters._seqs || !Array.isArray(filters._seqs)) filters._seqs = []
		if (filters._seq) {
			filters._seqs.push(filters._seq)
			delete filters._seq
		}
		let filteredData = []
		filters._seqs.forEach(seq => {
			filteredData.push(...data.filter(entry => entry._seq === seq))
		})
		delete filters._seqs
		Object.keys(filters).forEach(key => {			
			filteredData = filteredData.filter(entry => entry[key] === filters[key])
		})
		return filteredData
	}

	_send400 (message) {
		return this._sendError({
			type: 'ValueError',
			message
		}, 400)
	}

	_sendInvalidGroup (group) {
		return this._send400(`Invalid group, '/${ group }', was requested.`)
	}

	_send404 () {
		return this._sendError({
			type: 'QueryError',
			message: 'No data found.'
		}, 404)
	}

	_writeAndSend (target, data, code = 201) {			
		this._writeFile(target)
		return this._sendData(data, code)
	}

	/**
	 * === public  actions */
	
	create(modelName, group, data) {
		// serializeForDatabase(data)

		// body required
		if (data === '') {
			return this._sendError({
				type: 'ValueError',
				message: 'No Data provided.'
			}, 400)
		}

		// 'all' not allowed
		if (group === 'all') {
			return this._sendError({
				type: 'FatalError',
				message: 'Only God can create all.'
			}, 401)
		}

		// grab the model being used
		const target = this._getTarget(modelName)

		// route to the proper set of instructions
		switch (group) {
			case 'many':
				if (!Array.isArray(data)) {
					return sendError('Data provided must be an array.')
				}
				const ids = []
				data.forEach((d) => {
					const entry = this._createEntry(target, d)
					ids.push(entry.seq)
				})
				return this._writeAndSend(target, { ids })
			case 'one':
				console.log(target)
				const entry = this._createEntry(target, data)
				return this._writeAndSend(target, { id: entry._seq })
			default:
				return this._sendInvalidGroup(group)
		}
	}

	read(modelName, group, data) {
		let filteredData = this._getTargetData(modelName)
		if (group !== 'all') {
			if (data === '') {
				return this._send400('No search parameters provided.')
			}
			filteredData = this._filterData(filteredData, data)
			if (filteredData.length === 0) {
				return this._send404()
			}
			filteredData = group === 'one' 
				? filteredData[0] 
				: filteredData
		}
		return this._sendData(filteredData)
	}
	
	update(modelName, group, data) {
	
		const target = this._getTarget(modelName)
		const filters = {}
		const filteredData = []

		switch (group) {
			case 'one':
				if (!data.seq && !data.id) {
					return this._send400('Identifying id or seq information required.')
				}
				if (data.seq) filters._seq = data.seq
				if (data.id) filters._id = data.id
				filteredData.push(...this._filterData(target.data, filters))
				if (filteredData.length === 0) {
					return this._send404()
				}
				Object.keys(data).forEach(key => {
					filteredData[0][key] = data[key]
					filteredData[0]._updated = new Date()
				})
				return this._writeAndSend(target, filteredData[0], 200)
			case 'many':
				if (!data.seqs && !data.ids) {
					return this._send400('Identifying ids or seqs information array required.')
				}
				if (data.seqs) filters.seq = data.seq
				if (data.ids) filters.id = data.id
				filteredData.push(...this._filterData(target.data, filters))
				if (filteredData.length === 0) {
					return this._send404()
				}
				Object.keys(data).forEach(key => {
					filteredData[0][key] = data[key]
				})
				return this._writeAndSend(target, filteredData[0], 200)
			case 'all':
				let updated = 0
				target.data.forEach((d) => {
					Object.keys(data).forEach((key) => {
						if (d[key] !== data[key]) {
							d[key] = data[key]
							updated++
						}
					})
				})
				return this._writeAndSend(target, { updated }, 200)
			default:
				return this._sendInvalidGroup(group)
		}	
	}

	_deleteAll (target) {
		const length = target.data.length
		target.data = []
		target.count = 0
		return this._writeAndSend(target, { deleted: `All files (${ length } total.)` }, 202)
	}
	
	delete(modelName, group, data) {
		const target = this._getTarget(modelName)
		if (group === 'all') return this._deleteAll(target)
		const targetData = target.data
		const results = parseSeqNumbers(this._filterData(targetData, data))
		if (results.length === 0) return this._send404()
		const deleted = group === 'one'
			? results.slice(0, 1)
			: group === 'many'
				? results
				: null
		if (!deleted) return this._sendInvalidGroup(group)
		this._modeler.deleteData(target, deleted)
		return this._writeAndSend(target, { deleted: `seq(s) ${ deleted.join(', ') }` }, 202)
	}
}