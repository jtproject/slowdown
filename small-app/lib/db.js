import Filer from './filer.js'
import Modeler from './modeler.js'
import { DB_DIRECTORY } from '../config/constants.js'
import { dbLoadedMessage } from '../config/messages.js'
import { generalError } from '../utils/error.js'

class Controller {

	constructor (filer, modeler) {
		this._filer = filer
		this._modeler = modeler
	}
	
	create(model, group, data = null) {
		// console.log(data)
		// if (group === 'all') {
		// 	return this._sendError(401, 'Only God can create all.')
		// }
		// if (!data || Object.entries(data).length === 0) {
		// 	return this._sendError(400, 'No data provided.')
		// }
		// switch (group) {
		// 	case 'many':
		// 		return this.modeler.setMany(model, [{ test: 'test' }])
		// 	case 'one':
		// 		return this.modeler.set(model, data)
		// 	default:
		// 		return {}
		// }
		return { test: 'data' }
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

class SmallDb {

	constructor() {
		this._filer = new Filer(DB_DIRECTORY)
		this._modeler = new Modeler(this._filer.content)
	}
	
	connect(name) {
		this._filer.connect(name)
		this._modeler.connect(name, this._filer)
		dbLoadedMessage(name)
	}

	dispatch(modelName, action, group) {
		return new Controller(this._filer, this._modeler)[action].call(modelName, group, data)
	}

	_sendError(code, message) {
		return { error: { code, message	}}
	}
}

export default SmallDb