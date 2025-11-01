import http from 'http'
import SmallDb from './db.js'
import { ApiRequest } from './req.js'
import dotenv from 'dotenv'

dotenv.config()

const db = new SmallDb()

const server = http.createServer((req, res) => {
	if (req.url.startsWith('/api/')) {
		return new ApiRequest(req, res)	
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

const port = process.env.SERVER_PORT
server.listen(port, () => {
	console.log(`\x1b[31mjSys Connection Live on\x1b[0m :${ port }`)
})