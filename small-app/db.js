// Minimal file-based JSON DB for Node.js
import fs from 'fs'
import path from 'path'
import { dbLoadedMessage } from './messages.js'

class Filer {

	constructor(dir, create = false) {
		this.ext = 'jsys'
		this.setActiveDir(dir, create)
		this._cd('fake')
		console.log(this.activeFile)
		this.setActiveFile('sample.db')
		console.log(this.activeFile)
	}

	update() {
		
	}

	_cd(dir, create = false) {
		if (dir.startsWith('/')) {
			return this.setActiveDir(dir)
		}
		this._dirParts(dir).forEach(part => {
			switch (part) {
				case '':
					break
				case '..':
					this._toParentDir()
					break
				default:
					this._toChildDir(part, create)
			}
		})
	}

	_toParentDir() {
		this.setActiveDir(path.join('..', this.activeDir))
	}

	_toChildDir(child, create = false) {
		console.log(child)
		this.setActiveDir(path.join(this.activeDir, child), create)
	}

	_checkIfExists(value, type, create = false) {
		const label = type.slice(0, 1).toUpperCase() + type.slice(1)
		const methods = {
			dir: [this._isDir, this._newDir],
			file: [this._isFile, this._newFile]
		}
		if (!methods[type][0](value)) {
			if (create === true) methods[type][0](value)
			else throw Error(`${ label } does not exist: ${ value }`)
		}
	}

	setActiveDir(dir, create = false) {
		this._checkIfExists(dir, 'dir', create)
		this.activeDir = dir
	}

	setActiveFile(fileName, create = false) {
		this.activeFile = fileName === null ? null :this._checkIfExists(
			path.join(this.activeDir, fileName),
			'file',
			create
		)
	}

	_isDir(dir) {
		if (fs.existsSync(dir)) return true
		return false
	}

	_isFile(fileName) {
		return fs.existsSync(this._filePath(fileName))
	}

	_newDir(pathname) {
		fs.mkdirSync(pathname, { recursive: true })
	}

	_newFile(fileName) {
		const f = fs.openSync(this._filePath(fileName), 'w')
		fs.writeSync(f, JSON.stringify({
			name: fileName,
			index: 0,
			data: []
		}, null, 2), 'utf8')
		fs.closeSync(f)
	}

	_dirParts(dir) {
		return dir.split('/')
	}

	_filePath(fileName) {
		return path.join(this.activeDir, this._fileName(fileName))
	}

	_fileName(fileName) {
		return [fileName, this.ext].join('.')
	}
}

class Modeler {
	constructor() {
		console.log('modeler')
	}

}

class SmallDb {

	constructor() {
		const dir = path.join(process.cwd(), '.data')
		this.filer = new Filer(dir, true)
		this.modeler = new Modeler()		

		// this.populateDbs()
	}

	populateDbs() {
		this.dbs = []
		fs.readdirSync(this.filer.activeDir).forEach((db) => {
			this.dbs.push({
				name: db,
				models: [],
				modelCount: null
			})
		})
	}
	
	connect(name) {
		// if (this.getDbByName(name) === false) {
		// 	throw Error('Database does not exist. Connection failed.')
		// }
		// this.activeDb = name
		// this.populateModels(name)
		dbLoadedMessage(name)
		// return this.models[name]
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