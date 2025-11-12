import fs from 'fs'
import path from 'path'
import { capitalFirstLetterOnly } from '../utils/string.js'
import { generalError, referenceError } from '../utils/error.js'
import { BLANK_MODEL } from '../config/objects.js'

export default class Filer {
	
	constructor(dirName) {
		this._topDir = dirName
		this.content = []
		this._setActiveDir(dirName, true)
		this._setActiveFile(null)
	}

	connect(dirName, create = true) {
		this._setActiveDir(this._topDir)
		this._cd(dirName, create)
	}

	switch(dirName) {
		try {
			this.connect(dirName, false)
		} 
		catch (e) {
			referenceError(`Could not switch. Database '${dirName}' not found.`)
		}
	}

	write(fileName, data) {
		this._setActiveFile(fileName, true)
		this._writeFile(data)
		this._setActiveFile(null)
		return data
	}

	read(fileName) {
		this._setActiveFile(fileName, true)
		const data = this._readFile(fileName)
		this._setActiveFile(null)
		return data
	}

	_ls() {
		return fs.readdirSync(this.activeDir)
	}

	_cd(dir, create = false) {
		if (dir.startsWith('/')) {
			return this._setActiveDir(dir)
		}
		this._dirParts(dir).forEach(part => {
			switch (part) {
				case '': break
				case '..': this._toParentDir(); break
				default: this._toChildDir(part, create)
			}
		})
	}

	_toParentDir() {
		this._setActiveDir(path.join('..', this.activeDir))
	}

	_toChildDir(child, create = false) {
		this._setActiveDir(path.join(this.activeDir, child), create)
	}

	_setActiveDir(dir, create = false) {
		this._checkIfExists(dir, 'dir', create)
		this.activeDir = dir
		this.content = this._ls()
	}

	_isDir(dir) {
		return fs.existsSync(dir)
	}

	_newDir(pathname) {
		fs.mkdirSync(pathname, { recursive: true })
	}

	_setActiveFile(fileName, create = false) {
		if (fileName === null) return this.activeFile = null
		const baseName = this._normalizeFileName(fileName)
		this._checkIfExists(baseName, 'file', create)
		this.activeFile = baseName
	}

	_isFile(fileName) {
		return fs.existsSync(this._filePath(fileName))
	}

	_newFile(fileName) {
		const baseName = this._normalizeFileName(fileName)
		const filePath = this._filePath(baseName)
		fs.writeFileSync(filePath, JSON.stringify(BLANK_MODEL(baseName), null, 2), 'utf8')
	}

	_readFile(fileName) {
		const text = fs.readFileSync(this._filePath(fileName), 'utf8')
		return JSON.parse(text)
	}

	_writeFile(data) {
		const target = this.activeFile
		if (!target) generalError('No active file selected for write')
		fs.writeFileSync(this._filePath(target), JSON.stringify(data, null, 2), 'utf8')
	}

	_checkIfExists(value, type, create = false) {
		const methods = this._checkMethods()
		if (!methods[type][0](value)) {
			if (create === true) methods[type][1](value)
			else generalError(`${capitalFirstLetterOnly(type)} '${value}' does not exist.`)
		}
	}

	_checkMethods() {
		return {
			dir: [this._isDir.bind(this), this._newDir.bind(this)],
			file: [this._isFile.bind(this), this._newFile.bind(this)]
		}
	}

	_dirParts(dir) {
		return dir.split('/')
	}

	_filePath(fileName) {
		return path.join(this.activeDir, this._fileName(fileName))
	}

	_normalizeFileName(fileName) {
		if (typeof fileName !== 'string') return fileName
		const suffix = '.' + this._ext
		if (fileName.endsWith(suffix)) return fileName.slice(0, -suffix.length)
		return fileName
	}

	_fileName(fileName) {
		if (!fileName) return fileName
		const suffix = '.' + this._ext
		if (fileName.endsWith(suffix)) return fileName
		return [fileName, this._ext].join('.')
	}
}