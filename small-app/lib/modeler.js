import { BLANK_DB } from '../config/objects.js'
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
		// select database by name
		this._setActiveDb(dbName)
		// create model objects from filesys content
		this._populateModels(filer)
		console.log(this)
	}


	/** 
	 * === database controls */

	_populateDatabases (content) {
		// empty object to track file data
		this.object = {}
		// create db objects from filesys content
		content.forEach((dbName) => {
			this._appendDb(dbName)
		})
	}
	
	_setActiveDb (dbName) {
		if (!dbName) return this._activeDb = null
		this._activeDb = this.object[dbName]
	}

	_appendDb (dbName) {
		// create blank db object template
		this.object[dbName] = BLANK_DB(dbName)
	}


	/** 
	 * === model controls */

	_populateModels (filer) {
		filer.content.forEach((model) => {
			const modelName = fileNameRoot(model)
			this._activeDb.models[modelName] = this.get(modelName)
			this._loadModelData(modelName, filer.read)
			this._activeDb.modelCount++
		})
	}

	_loadModelData (modelName, callback) {
		this._activeDb.models[modelName] = callback.call(modelName)
	}

	_getModelData (modelName) {
		return this._activeDb.models[modelName]
	}
	
	_insertModelData(modelName, data) {
		const modelData = this._getModelData(modelName)
		if (modelData.data) {
			modelData.data.push(data)
			this._getModelData(modelName).index++
		}
	}
	
	






	
	set(point, data) {
		if (!this._activeDb.models[point]) {
			this._setPoint(point)
		}
		this._insertModelData(point, data)
		return this._getPoint(point)
		// const response = this.filer.write(point, data)
		// return response
	}

	setMany(point, data) {
		if (!Array.isArray(data)) generalErrorJson(`Data for setMany must be an array. Received ${ typeof(data) } instead.`)
		const response = []
		data.forEach((entry) => {
			this._insertModelData(point, entry)
			response.push(entry)
		})
		this.filer.write(point, data)
		return response
	}
	
	get(point) {
		// const data = this.filer.read(point)
		// this._activeDb.models[point] = data
		// return data
	}
}