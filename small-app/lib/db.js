import Filer from './filer.js'
import Modeler from './modeler.js'
import Controller from './controller.js'
import { DB_DIRECTORY } from '../config/constants.js'
import { dbLoadedMessage } from '../config/messages.js'
import { generalError } from '../utils/error.js'

class Validater {
	
	constructor () {
		
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
		const controller = new Controller(this._filer, this._modeler)
		[action].call(modelName, group, data)
		return controller.ok
	}

	validate () {}

	_sendError(code, message) {
		return { error: { code, message	}}
	}

	_sendData (data) {
		return { data }
	}
}

export default SmallDb