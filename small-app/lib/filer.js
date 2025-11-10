import fs from 'fs'
import path from 'path'
import { capitalFirstLetterOnly } from '../utils/string.js'
import { generalError, referenceError } from '../utils/error.js'

/**
 * File-based storage system for managing JSON data files
 * within a directory structure
 */
export default class Filer {

	// === Constructor and Public Interface ===
	
	constructor(dirName) {
		this._topDir = dirName
		this._ext = 'jsys'
		this.content = []
		this._setActiveDir(dirName, true)
		this._setActiveFile(null)
	}

	// Connect to a database directory, creating it if needed
	connect(dirName, create = true) {
		this._setActiveDir(this._topDir)
		this._cd(dirName, create)
	}

	// Switch to an existing database directory
	switch(dirName) {
		try {
			this.connect(dirName, false)
		} 
		catch (e) {
			referenceError(`Could not switch. Database '${dirName}' not found.`)
		}
	}

	// Write data to a JSON file
	write(fileName, data) {
		this._setActiveFile(fileName, true)
		this._writeFile(data)
		this._setActiveFile(null)
	}

	// Read and parse JSON data from a file
	get(fileName) {
		this._setActiveFile(fileName, true)
		const data = this._readFile(fileName)
		this._setActiveFile(null)
		return data
	}

	// === Directory Operations ===
	
	// List contents of current directory
	_ls() {
		return fs.readdirSync(this.activeDir)
	}

	// Change directory, handling relative and absolute paths
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

	// === File Operations ===

	_setActiveFile(fileName, create = false) {
		if (fileName === null) return this.activeFile = null
		if (typeof fileName !== 'string' || fileName.trim() === '') {
			generalError('Invalid file name provided')
		}
		// Normalize to a base name (store without extension)
		const baseName = this._normalizeFileName(fileName)
		this._checkIfExists(baseName, 'file', create)
		this.activeFile = baseName
	}

	_isFile(fileName) {
		return fs.existsSync(this._filePath(fileName))
	}

	_newFile(fileName) {
		const baseName = this._normalizeFileName(fileName)
		const initial = {
			name: baseName,
			index: 0,
			data: []
		}
		const filePath = this._filePath(baseName)
		fs.writeFileSync(filePath, JSON.stringify(initial, null, 2), 'utf8')

		// Refresh cached listing so the new file appears in `content`
		try {
			this.content = this._ls()
		} catch (e) {
			// non-fatal: leave existing content if listing fails
		}
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

	// === Utility Methods ===

	// Check if file/dir exists and create if needed
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

	/**
	 * Normalize a file name to its base (without extension).
	 * If the caller passed a name that already includes the extension,
	 * strip it so the rest of the class stores base names consistently.
	 */
	_normalizeFileName(fileName) {
		if (typeof fileName !== 'string') return fileName
		const suffix = '.' + this._ext
		if (fileName.endsWith(suffix)) return fileName.slice(0, -suffix.length)
		return fileName
	}

	_fileName(fileName) {
		// Accept either a base name or a name that already includes the
		// extension. Always return a filename with exactly one extension.
		if (!fileName) return fileName
		const suffix = '.' + this._ext
		if (fileName.endsWith(suffix)) return fileName
		return [fileName, this._ext].join('.')
	}
}