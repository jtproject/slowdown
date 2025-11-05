import http from 'http'
import SmallDb from './db.js'
import { ApiRequest, HtmlRequest } from './req.js'
import dotenv from 'dotenv'
import { connecionMessage, startupMessage } from './message.js'

// setup
dotenv.config()
startupMessage()

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
	db.connect('fake')
	connecionMessage(port)
})