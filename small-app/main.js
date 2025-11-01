import http from 'http'
import SmallDb from './db.js'
import { ApiRequest } from './req.js'



const db = new SmallDb()

const server = http.createServer((req, res) => {
	if (req.url.startsWith('/api/')) {
		new ApiRequest(req, res)	
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