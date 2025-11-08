import fs from 'fs'
import path from 'path'

export default class Filer {

	constructor(dir) {
		this.topDir = dir
		this.ext = 'jsys'
		this._setActiveFile(null)
		this._setActiveDir(dir, true)
	}

	connect(dirName) {
		this._setActiveDir(this.topDir)
		this._cd(dirName, true)
	}

	switch(dirName) {
		this.connect(dirName)
	}

	write(fileName, data) {
		this._setActiveFile(fileName, true)
		this._writeFile(data)
	}

	get(fileName) {
		this._setActiveFile(fileName, true)
		const content = fs.readFileSync(this._filePath(fileName), 'utf8')
		return JSON.parse(content)
	}

	_cd(dir, create = false) {
		if (dir.startsWith('/')) {
			return this._setActiveDir(dir)
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
		this._setActiveDir(path.join('..', this.activeDir))
	}

	_toChildDir(child, create = false) {
		this._setActiveDir(path.join(this.activeDir, child), create)
	}

	_checkIfExists(value, type, create = false) {
		const label = type.slice(0, 1).toUpperCase() + type.slice(1)
		const methods = {
			dir: [this._isDir.bind(this), this._newDir.bind(this)],
			file: [this._isFile.bind(this), this._newFile.bind(this)]
		}
		if (!methods[type][0](value)) {
			if (create === true) methods[type][1](value)
			else throw Error(`${ label } does not exist: ${ value }`)
		}
	}

	_setActiveDir(dir, create = false) {
		this._checkIfExists(dir, 'dir', create)
		this.activeDir = dir
	}

	_setActiveFile(fileName, create = false) {
		if (fileName === null) return this.activeFile = null
		this._checkIfExists(fileName,	'file',	create)
		this.activeFile = fileName
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
		this._writeFile({
			name: fileName,
			index: 0,
			data: []
		})
	}
	
	_writeFile(data) {
		fs.writeFileSync(this._filePath(this.activeFile), JSON.stringify(data, null, 2), 'utf8')
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