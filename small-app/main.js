import http from 'http'
import SmallDb from './db.js'
import { ApiRequest, HtmlRequest } from './req.js'
import dotenv from 'dotenv'

// setup
dotenv.config()
const port = process.env.SERVER_PORT
const db = new SmallDb()

// handle requests
const server = http.createServer((req, res) => {
	if (req.url.startsWith('/api/'))
		return new ApiRequest(req, res, db)	
	return new HtmlRequest(req, res)
})

// start server connection
server.listen(port, () => {
	console.log(`\x1b[35mjSys Connection Live on >>\x1b[0m :${ port }`)
	db.connect('fake')
})