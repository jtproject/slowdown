import http from 'http'
import SmallDb from './db.js'
import { ApiRequest } from './req.js'
import dotenv from 'dotenv'

// setup
dotenv.config()
const port = process.env.SERVER_PORT

// handle requests
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

// start server connection
server.listen(port, () => {
	console.log(`\x1b[31mjSys Connection Live on\x1b[0m :${ port }`)
	// connect database
	const db = new SmallDb()
})