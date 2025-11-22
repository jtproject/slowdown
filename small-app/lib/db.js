import Filer from './filer.js'
import Modeler from './modeler.js'
import Controller from './controller.js'
import { DB_DIRECTORY } from '../config/constants.js'
import { dbLoadedMessage } from '../config/messages.js'

class Validater {
	
	constructor () {

	}
}

class SmallDb {

	constructor() {
		this._filer = new Filer(DB_DIRECTORY)
		this._modeler = new Modeler(this._filer.content)
		this._validater = new Validater()
	}
	
	connect(name) {
		this._filer.connect(name)
		this._modeler.connect(name, this._filer)
		dbLoadedMessage(name)
	}

	dispatch(modelName, action, group, data) {
		return new Controller(this._filer, this._modeler)
		[action](modelName, group, data)
	}

	validate () {}
}

export default SmallDb