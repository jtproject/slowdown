import { BLANK_DB, BLANK_MODEL } from '../config/objects.js'
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

	newModel (modelName, object = BLANK_MODEL) {
		this._createModelTemplate(modelName, object)
	}
	
	getModel (modelName) {
		const result = this._getModel(modelName)
		if (!result) return false
		return result
	}

	addData (model, ...data) {
		data.forEach((d) => {
			model.data.push(d)
			model.count++
			model.index++
		})
	}

	deleteData (model, seqs) {
		seqs.forEach(seq => {
			model.data = model.data.filter(d => d._seq !== seq)
		})
		model.count = model.data.length
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
	
	_getModel (modelName) {
		return this._activeDb.models[modelName]
	}

	_getModelData (modelName) {
		return this._getModel(modelName).data
	}
	
	_createModelTemplate (modelName, template = BLANK_MODEL) {
		this._activeDb.models[modelName] = template
		this._activeDb.modelCount++
	}
	
	_insertModelData (modelName, data) {
		const modelData = this._getModelData(modelName)
		if (modelData.data) {
			modelData.data.push(data)
			this._getModel(modelName).index++
		}
	}
}