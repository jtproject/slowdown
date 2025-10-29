import http from 'http'
import SmallDb from './db.js'

const API_ACTIONS = [
	'create',
	'read',
	'update',
	'delete'
]

const API_ACTION_GROUPS = [
	'one',
	'many',
	'all'
]

const db = new SmallDb()

const server = http.createServer((req, res) => {
	if (req.url.startsWith('/api/')) {
		const url = req.url.slice(4)
		
	}
	else if (req.url !== '/' 
		&& !req.url.startsWith('/?')) {
		res.writeHead(
			302, 
			{ Location: `/?path=${ req.url }` }
		)
	}
	res.end()
})

server.listen(8000, () => {
	console.log('connected')
})