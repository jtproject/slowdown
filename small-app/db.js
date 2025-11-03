// Minimal file-based JSON DB for Node.js
import fs from 'fs'
import path from 'path'

class SmallDb {
	constructor() {
		this.dir = path.join(process.cwd(), '.data')
		this.confirmDir(this.dir)
		this.populateDbs()
	}
	
	connect(name) {
		if (this.getDbByName(name) === false) {
			throw Error('Database does not exist. Connection failed.')
		}
		this.activeDb = name
		this.populateModels(name)
		return this.models[name]
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

	getActiveDb() {
		return this.getDbByName(this.activeDb)
	}

	getDbByName(name) {
		const query = this.dbs.filter((n) => n.name === name)
		if (query.length > 0) return query[0]
		return false
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

	newModel(name) {
		const model = {
			name,
			index: 0,
			data: []
		}
		this.getActiveDb()[name] = model
		fs.writeFileSync(path.join(this.dir, this.activeDb, name + '.db'), JSON.stringify(model))
	}

	confirmDir(dir, parent = null) {
		if (parent) dir = path.join(parent, dir)
		if (!fs.existsSync(dir)) this.addDir(dir)
	}

	addDir(pathname) {
		fs.mkdirSync(pathname, { recursive: true })
	}

	newDb(name) {
		this.addDir(path.join(this.dir, name))
	}



	create(model, data) {

	}

	read(model, filter, query = {}) {
		return this.models[this.activeDb][model].data
	}
}

export default SmallDb