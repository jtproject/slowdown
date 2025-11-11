import SmallDb from './small-app/db.js'
import fs from 'fs'

// Clean up
if (fs.existsSync('.data')) {
  fs.rmSync('.data', { recursive: true, force: true })
}

const db = new SmallDb()
db.connect('testdb')

// Test 1: set with empty object
console.log('\n=== Test 1: set() with empty object ===')
db.create('users', 'one', {})
console.log('File content:', fs.readFileSync('.data/testdb/users.jsys', 'utf8'))

// Test 2: set with some data
console.log('\n=== Test 2: set() with data ===')
db.create('posts', 'one', { title: 'Hello' })
console.log('File content:', fs.readFileSync('.data/testdb/posts.jsys', 'utf8'))

// Test 3: verify get() reads template structure
console.log('\n=== Test 3: get() reads template ===')
const users = db.modeler.get('users')
console.log('users structure:', users)

console.log('\n✅ All tests completed')
