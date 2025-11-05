import http from 'http'
import SmallDb from './db.js'
import { ApiRequest, HtmlRequest } from './req.js'
import dotenv from 'dotenv'

// setup
dotenv.config()
const port = process.env.SERVER_PORT

// connect database
const db = new SmallDb()
const connection = db.connect('fake')

// handle requests
const server = http.createServer((req, res) => {
	if (req.url.startsWith('/api/'))
		return new ApiRequest(req, res, db)	
	return new HtmlRequest(req, res)
})

// start server connection
server.listen(port, () => {
	console.log(`\x1b[31mjSys Connection Live on\x1b[0m :${ port }`)
	console.log(connection)
})