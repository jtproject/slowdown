import { BLANK_API_RESPONSE } from "../config/objects.js"

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

	/**
	 * === public  actions */
	
	create(model, group, data) {

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

		let target = this._modeler.get(model)
		if (!target) {
			target = this._filer.read(model, true)
			this._modeler.new(model, target)
		}

		switch (group) {
			case 'many':

				// return this._modeler.setMany(model, data)
			case 'one':
				// return this._modeler.set(model, data)
			default:
				return {}
		}
		return this._sendData(data, 201)
	}
	
	read(model, group, data = null) {
		// let filteredData = this.modeler.get(model).data
		// if (data) {
		// 	Object.entries(data).forEach(([key, value]) => {
		// 		filteredData = filteredData.filter(entry => entry[key] === value)
		// 	})
		// 	if (filteredData.length === 0 && group !== 'all') {
		// 		return this._sendError(404, 'No data.')
		// 	}
		// }
		// if (group === 'one') return filteredData[0]
		// return filteredData
		return { test: 'data' }
	}
	
	update(model, group, data = {}) {
		return { test: 'data' }
	}
	
	delete(model, group, data = {}) {
		return { test: 'data' }
	}
}
