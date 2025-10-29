// Minimal file-based JSON DB for Node.js
import fs from 'fs'
import path from 'path'

class SmallDb {
	constructor() {
		this.dir = path.join(process.cwd(), '.data')
		if (!fs.existsSync(this.dir)) {
			fs.mkdirSync(this.dir, { recursive: true })
		}
	}

	

	create(model, data) {

	}
}

export default SmallDb