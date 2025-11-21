import { BLANK_API_RESPONSE, BLANK_MODEL } from "../config/objects.js"
import RESPONSE_CODES from "../config/status.js"

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
			id: 'coming-soon',
			seq: model.index,
			created: timestamp,
			updated: timestamp
		}
		model.data.push(entry)
		model.index++
		model.count = model.data.length
		return entry
	}

	_writeFile (model) {
		this._filer.write(model.name, model)
	}

	/**
	 * === public  actions */
	
	create(modelName, group, data) {

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
		let target = this._modeler.get(modelName)
		if (!target) {
			this._modeler.new(modelName)
			this._filer.write(modelName, BLANK_MODEL)
			target = this._modeler.get(modelName)
		}

		// for sending data after instructions are complete
		const writeAndSend = (data) => {			
			this._writeFile(target)
			return this._sendData(data, 201)
		}

		// error handling for /create routes 
		const sendError = (message) => {
			return this._sendError({
				type: 'ValueError',
				message
			}, 400)
		}

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
				return writeAndSend({ ids })
			case 'one':
				const entry = this._createEntry(target, data)
				return writeAndSend({ id: entry.seq })
			default:
				return sendError(`Invalid group, '/${ group }', was requested.`)
		}
	}
	
	read(modelName, group, data) {
		let filteredData = this._modeler.get(modelName).data
		if (data) {
			Object.entries(data).forEach(([key, value]) => {
				filteredData = filteredData.filter(entry => entry[key] === value)
			})
			if (filteredData.length === 0 && group !== 'all') {
				return this._sendError({
					type: 'QueryError',
					message: 'No data found.'
				}, 404)
			}
		}
		if (group === 'one') return this._sendData(filteredData[0])
		return this._sendData(filteredData)
	}
	
	update(model, group, data = {}) {
		return { test: 'data' }
	}
	
	delete(model, group, data = {}) {
		return { test: 'data' }
	}
}
