import http from 'http'

const server = http.createServer((req, res) => {
	if (req.url.startsWith('/api/')) {
		console.log('not yet')	
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