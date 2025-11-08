import http from 'http'
import SmallDb from './db.js'
import ApiRequest from './lib/apireq.js'
import HtmlRequest from './lib/htmlreq.js'
import dotenv from 'dotenv'
import { connecionMessage, startupMessage } from './config/messages.js'

// setup
dotenv.config()
startupMessage()
const port = process.env.SERVER_PORT
const db = new SmallDb()

// handler for requests
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