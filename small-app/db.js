// Minimal file-based JSON DB for Node.js
import path from 'path'
import { dbLoadedMessage } from './config/messages.js'
import Filer from './lib/filer.js'
import { generalErrorJson } from './utils/error.js'
import { BLANK_DB, BLANK_MODEL } from './config/objects.js'

class Modeler {
	
	constructor(dirName) {
		this.object = {}
		this.pointer = null
		this.filer = new Filer(dirName)
		this._populateDatabases()
	}
	
	connect(objName) {
		this.filer.connect(objName, true)
		this.pointer = this.object[objName]
		this._populateModels()
		console.log(this)
	}

	
	set(point, data) {
		if (!this.pointer.models[point]) {
			this._setPoint(point)
		}
		this._insertModelData(point, data)
		return this._getPoint(point)
		// const response = this.filer.write(point, data)
		// return response
	}

	_setPoint (point) {
		this.pointer.models[point] = this.filer.read(point)
	}

	_getPoint (point) {
		return this.pointer.models[point]
	}
	
	setMany(point, data) {
		if (!Array.isArray(data)) generalErrorJson(`Data for setMany must be an array. Received ${ typeof(data) } instead.`)
		const response = []
		data.forEach((entry) => {
			console.log(entry)
			this._insertModelData(point, entry)
			response.push(entry)
		})
		this.filer.write(point, data)
		return response
	}
	
	get(point) {
		const data = this.filer.read(point)
		this.pointer.models[point] = data
		return data
	}
	
	_populateDatabases () {
		this.filer.content.forEach((dbName) => {
			this._appendDb(dbName)
		})
	}
	
	_appendDb (dbName) {
		this.object[dbName] = BLANK_DB(dbName)
	}
	
	_populateModels () {
		this.filer.content.forEach((modelName) => {
			const name = modelName.split('.')[0]
			this.pointer.models[name] = this.get(name)
			this.pointer.modelCount++
		})
	}

	_insertModelData(modelName, data) {
		this._getPoint(modelName).data.push(data)
	}
}

class SmallDb {

	constructor() {
		const dir = path.join(process.cwd(), '.data')
		this.modeler = new Modeler(dir)		
	}
	
	connect(name) {
		this.modeler.connect(name)
		dbLoadedMessage(name)
	}

	_sendError(code, message) {
		return { error: { code, message	}}
	}
	
	create(model, group, data = null) {
		console.log(data)
		if (group === 'all') {
			return this._sendError(401, 'Only God can create all.')
		}
		if (!data || Object.entries(data).length === 0) {
			return this._sendError(400, 'No data provided.')
		}
		switch (group) {
			case 'many':
				return this.modeler.setMany(model, [{ test: 'test' }])
			case 'one':
				return this.modeler.set(model, data)
			default:
				return {}
		}
	}

	read(model, group, data = null) {
		let filteredData = this.modeler.get(model).data
		if (data) {
			Object.entries(data).forEach(([key, value]) => {
				filteredData = filteredData.filter(entry => entry[key] === value)
			})
			if (filteredData.length === 0 && group !== 'all') {
				return this._sendError(404, 'No data.')
			}
		}
		if (group === 'one') return filteredData[0]
		return filteredData
	}

	update(model, group, data = {}) {

	}
	
	delete(model, group, data = {}) {

	}
}

export default SmallDb