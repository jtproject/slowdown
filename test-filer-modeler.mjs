import SmallDb from './small-app/db.js'
import fs from 'fs'

// Clean up any previous test folder for a deterministic run
const base = '.data'
if (fs.existsSync(base)) {
  // remove recursively for test purposes
  fs.rmSync(base, { recursive: true, force: true })
}

const db = new SmallDb()
console.log('modeler.object (initial):', db.modeler.object)
console.log('modeler.pointer (initial):', db.modeler.pointer)

// Connect (should create .data/testdb and populate modeler)
db.connect('testdb')
console.log('modeler.object (after connect):', db.modeler.object)
console.log('modeler.pointer (after connect):', db.modeler.pointer)

// Show filesystem
console.log('filesystem listing:', fs.readdirSync('.data'))
