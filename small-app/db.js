// Minimal file-based JSON DB for Node.js
import path from 'path'
import { dbLoadedMessage } from './config/messages.js'
import Filer from './lib/filer.js'

class Modeler {
	
	constructor(dirName) {
		this.object = {}
		this.pointer = null
		this.filer = new Filer(dirName)
		this._populate()
	}
	
	connect(objName) {
		this.filer.connect(objName, true)
		if (!this.object[objName]) {
			this.object[objName] = { name: objName, models: {} }
		}
		this.pointer = this.object[objName]
		this._populate()
		console.log(this)
	}
	
	set(point, data) {
		this.pointer.models[point] = data
		const response = this.filer.write(point, data)
		return response
	}
	
	get(point) {
		const data = this.filer.read(point)
		this.pointer.models[point] = data
		return data
	}

	_populate() {
		const list = this.filer.content || []
		list.forEach((name) => {
			if (!this.pointer) {
				if (!this.object[name]) this.object[name] = { name, models: {} }
			} 
			else {
				const data = this.filer.get(name)
				this.set(name, data)
			}
		})
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
	
	create(model, group, data = {}) {
		switch (group) {
			case 'all':
				return this._sendError(401, 'Only God can create all.')
			case 'many':
				return this.modeler.set(model, data)
			case 'one':
				return this.modeler.set(model, data)
			default:
				return {}
		}
	}

	read(model, group, data = {}) {
		// const modelObj = this.getModelFromActiveDbByName(model)
		// if (!modelObj) return group === 'all' ? [] : null
		// const data = modelObj.data || []
		// let filteredData = data
		// if (filters && Object.keys(filters).length > 0) {
		// 	filteredData = data.filter(item => {
		// 		return Object.entries(filters).every(([key, value]) => {
		// 			return item[key] == value
		// 		})
		// 	})
		// }
		// switch (group) {
		// 	case 'all': return data
		// 	case 'many': return filteredData
		// 	case 'one': return filteredData[0] || null
		// 	default: return null
		// }
	}

	update(model, group, data = {}) {

	}
	
	delete(model, group, data = {}) {

	}
}

export default SmallDb