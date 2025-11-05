// Minimal file-based JSON DB for Node.js
import fs from 'fs'
import path from 'path'

class SmallDb {



	constructor() {
		this.dir = path.join(process.cwd(), '.data')
		this.confirmDir(this.dir)
		this.populateDbs()
	}

	confirmDir(dir, parent = null) {
		if (parent) dir = path.join(parent, dir)
		if (!fs.existsSync(dir)) this.addDir(dir)
	}

	populateDbs() {
		this.dbs = []
		fs.readdirSync(this.dir).forEach((db) => {
			this.dbs.push({
				name: db,
				models: [],
				modelCount: null
			})
		})
	}
	
	connect(name) {
		if (this.getDbByName(name) === false) {
			throw Error('Database does not exist. Connection failed.')
		}
		this.activeDb = name
		this.populateModels(name)
		console.log(`\x1b[36mLoaded database models >> \x1b[0m${ name }`)
		return this.models[name]
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

	getActiveDb() {
		return this.getDbByName(this.activeDb)
	}

	getDbByName(name) {
		const query = this.dbs.filter((n) => n.name === name)
		if (query.length > 0) return query[0]
		return false
	}

	newModel(name) {
		const model = {
			name,
			index: 0,
			data: []
		}
		this.getActiveDb()[name] = model
		fs.writeFileSync(path.join(this.dir, this.activeDb, name + '.db'), JSON.stringify(model))
	}


	addDir(pathname) {
		fs.mkdirSync(pathname, { recursive: true })
	}

	newDb(name) {
		this.addDir(path.join(this.dir, name))
	}

	addEntry(model, entry) {
		// Get the model object from memory
		const modelObj = this.getModelFromActiveDbByName(model)
		if (!modelObj) {
			this.newModel(model)
			return this.addEntry(model, entry)
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

	read(model, group, body = {}) {
		const data = this.getModelFromActiveDbByName(model).data
		let filteredData = data
		Object.entries(body).forEach(param => {
			filteredData = filteredData.filter(p => p[param] === param)
		})
		switch (group) {
			case 'all': return data
			case 'many': return filteredData
			case 'one': return filteredData[0]
			default: return null
		}
	}

	getModelsFromActiveDb() {
		return this.models[this.activeDb]
	}

	getModelFromActiveDbByName(model) {
		return this.getModelsFromActiveDb[model]
	}
}

export default SmallDb