import { BLANK_DB, BLANK_MODEL } from '../config/objects.js'
import { generalErrorJson } from '../utils/error.js'
import { fileNameRoot } from '../utils/file.js'

export default class Modeler {
	
	constructor (content) {
		this._setActiveDb(null)
		this._populateDatabases(content)
	}
	
	/**
	 * === public methods */

	connect (dbName, filer) {
		this._setActiveDb(dbName)
		this._populateModels(filer)
	}

	new (modelName, object = BLANK_MODEL) {
		this._createModelTemplate(modelName, object)
	}
	
	get(modelName) {
		const result = this._getModelData(modelName)
		if (!result) return false
		return result
	}
	
	/** 
	 * === database controls */

	_populateDatabases (content) {
		this.object = {}
		content.forEach((dbName) => {
			this._appendDb(dbName)
		})
	}
	
	_setActiveDb (dbName) {
		if (!dbName) return this._activeDb = null
		this._activeDb = this.object[dbName]
	}

	_appendDb (dbName) {
		this.object[dbName] = BLANK_DB(dbName)
	}

	/** 
	 * === model controls */

	_populateModels (filer) {
		filer.content.forEach((model) => {
			const modelName = fileNameRoot(model)
			this._createModelTemplate(modelName, filer.read(modelName))
		})
	}
	
	_getModelData (modelName) {
		return this._activeDb.models[modelName]
	}
	
	_createModelTemplate (modelName, template = BLANK_MODEL) {
		this._activeDb.models[modelName] = template
		this._activeDb.modelCount++
	}
	
	_insertModelData (modelName, data) {
		const modelData = this._getModelData(modelName)
		if (modelData.data) {
			modelData.data.push(data)
			this._getModelData(modelName).index++
		}
	}
	
	






	
	set(modelName, data) {
		if (!this._getModelData(modelName)) {
			// this._setPoint(point)
			console.log('no model')
			return
		}
		// this._insertModelData(point, data)
		// return this._getPoint(point)
		console.log('bye')
	}

	setMany(point, data) {
		if (!Array.isArray(data)) generalErrorJson(`Data for setMany must be an array. Received ${ typeof(data) } instead.`)
		const response = []
		data.forEach((entry) => {
			this._insertModelData(point, entry)
			response.push(entry)
		})
		return response
	}
	
}