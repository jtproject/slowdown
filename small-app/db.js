// Minimal file-based JSON DB for Node.js
import fs from 'fs'
import path from 'path'
import { dbLoadedMessage } from './config/messages.js'
import Filer from './lib/filer.js'

class Modeler {
	
	constructor(dirName) {
		this.object = {}
		this.pointer = null
		this.filer = new Filer(dirName)
		// Ensure we have an up-to-date view of available DBs
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
	
	_populate() {
		const list = this.filer.content || []
		list.forEach((name) => {
			if (!this.pointer) {
				if (!this.object[name]) this.object[name] = { name, models: {} }
			} else {
				this.pointer.models[name] = this.filer.get(name)
			}
		})
	}
}

class SmallDb {

	constructor() {
		const dir = path.join(process.cwd(), '.data')
		this.modeler = new Modeler(dir)		
		
		// this.populateDbs()
	}

	populateDbs() {
		const content = this.filer.content
	content.forEach((db) => {
			this.dbs.push({
				name: db,
				models: [],
				modelCount: null
			})
		})
	}
	
	connect(name) {
		// this.filer.connect(name)
		this.modeler.connect(name)
		dbLoadedMessage(name)
	}

	populateModels() {
		this.models = {}
		this.dbs.forEach((db) => {
			const pathname = path.join(this.dir, db.name)
			const files = fs.readdirSync(pathname)
			this.getDbByName(db.name).modelCount = files.length
			const dbData = {}
			files.forEach((file) => {
				this.getDbByName(db.name).models.push(file.replace('.db', ''))
				const model = JSON.parse(
					fs.readFileSync(
						path.join(pathname, file)
					)
				)
				dbData[model.name] = {
					...model,
					count: model.data.length
				}
			})
			this.models[db.name] = dbData
		})
	}

	
	newDb(name) {
		this._newDir(path.join(this.dir, name))
	}

	newModel(name) {
		const model = {
			name,
			index: 0,
			data: []
		}

		this.models[this.activeDb][name] = model
		fs.writeFileSync(path.join(this.dir, this.activeDb, name + '.db'), JSON.stringify(model))
	}
	
	addEntry(model, entry) {
		// Get the model object from memory
		let modelObj = this.getModelFromActiveDbByName(model)
		if (!modelObj) {
			this.newModel(model)
			modelObj = this.getModelFromActiveDbByName(model)
		}
		
		// Create new entry with metadata
		const newEntry = {
			id: modelObj.index++,
			...entry,
			createdAt: new Date().toISOString()
		}

		// Update in-memory model
		modelObj.data.push(newEntry)
		modelObj.count = modelObj.data.length
		
		// Save to file
		const filePath = path.join(this.dir, this.activeDb, model + '.db')
		fs.writeFileSync(filePath, JSON.stringify(modelObj, null, 2))
		
		return newEntry
	}
	
	create(model, group, body = {}) {
		const entry = this.addEntry(model, body)
		return group === 'one' ? entry : this.getModelFromActiveDbByName(model).data
	}

	read(model, group, filters = {}) {
		const modelObj = this.getModelFromActiveDbByName(model)
		if (!modelObj) return group === 'all' ? [] : null
		const data = modelObj.data || []
		let filteredData = data
		if (filters && Object.keys(filters).length > 0) {
			filteredData = data.filter(item => {
				return Object.entries(filters).every(([key, value]) => {
					// loose comparison to allow numbers/strings
					return item[key] == value
				})
			})
		}
		switch (group) {
			case 'all': return data
			case 'many': return filteredData
			case 'one': return filteredData[0] || null
			default: return null
		}
	}

	getActiveDb() {
		return this.getDbByName(this.activeDb)
	}
	
	getDbByName(name) {
		const query = this.dbs.filter((n) => n.name === name)
		if (query.length > 0) return query[0]
		return false
	}

	getModelsFromActiveDb() {
		if (!this.models) this.models = {}
		return this.models[this.activeDb] || {}
	}

	getModelFromActiveDbByName(model) {
		const models = this.getModelsFromActiveDb()
		return models[model] || {}
	}
}

export default SmallDb