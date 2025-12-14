import http from 'http'

const PORT = process.env.SERVER_PORT || '9001'

function request (method, path, body = undefined) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: '127.0.0.1',
      port: PORT,
      path,
      method,
      headers: {}
    }

    let payload = null
    if (body !== undefined) {
      payload = JSON.stringify(body)
      opts.headers['Content-Type'] = 'application/json'
      opts.headers['Content-Length'] = Buffer.byteLength(payload)
    }

    const req = http.request(opts, (res) => {
      const chunks = []
      res.on('data', c => chunks.push(c))
      res.on('end', () => {
        const text = Buffer.concat(chunks).toString('utf8')
        let parsed = null
        try { parsed = JSON.parse(text) } catch (e) { parsed = text }
        resolve({ status: res.statusCode, body: parsed })
      })
    })

    req.on('error', reject)
    if (payload) req.write(payload)
    req.end()
  })
}

async function startServer () {
  // set port env before importing main
  process.env.SERVER_PORT = PORT
  // import main.js to start server in-process
  await import('../main.js')

  // wait for server to be responsive by polling root path
  for (let i = 0; i < 30; i++) {
    try {
      await request('GET', '/')
      return true
    } catch (e) {
      await new Promise(r => setTimeout(r, 100))
    }
  }
  throw new Error('Server did not start')
}

async function runTests () {
  console.log('Starting server (in-process)...')
  await startServer()
  console.log('Server started. Running API endpoint tests...')

  const model = 'unittestmodel'
  const results = {}

  try {
    // 1: create one
    let res = await request('POST', `/api/${model}/create/one`, { name: 'one' })
    if (res.status !== 201) throw new Error('create/one failed: ' + JSON.stringify(res))
    const createdOne = res.body && res.body.data ? res.body.data : res.body
    results.id1 = createdOne?.id
    results.seq1 = createdOne?.seq

    // 2: create many
    res = await request('POST', `/api/${model}/create/many`, [{ name: 'two' }, { name: 'three' }])
    if (res.status !== 201) throw new Error('create/many failed: ' + JSON.stringify(res))
    const createdMany = res.body && res.body.data ? res.body.data : res.body
    results.id2 = createdMany[0]?.id
    results.id3 = createdMany[1]?.id

    // 3: read all
    res = await request('GET', `/api/${model}/read/all`)
    if (res.status !== 200) throw new Error('read/all failed: ' + JSON.stringify(res))

    // 4: read one by id1
    res = await request('GET', `/api/${model}/read/one`, { id: results.id1 })
    if (res.status !== 200) throw new Error('read/one failed: ' + JSON.stringify(res))

    // 5: read many by ids
    res = await request('GET', `/api/${model}/read/many`, { ids: [results.id2, results.id3] })
    if (res.status !== 200) throw new Error('read/many failed: ' + JSON.stringify(res))

    // 6: update one
    res = await request('PATCH', `/api/${model}/update/one`, { seq: results.seq1, updates: { updated: true } })
    if (res.status !== 200) throw new Error('update/one failed: ' + JSON.stringify(res))

    // 7: update many
    res = await request('PATCH', `/api/${model}/update/many`, { ids: [results.id2, results.id3], updates: { bulk: true } })
    if (res.status !== 200) throw new Error('update/many failed: ' + JSON.stringify(res))

    // 8: update all
    res = await request('PATCH', `/api/${model}/update/all`, { updates: { allUpdated: true } })
    if (res.status !== 200) throw new Error('update/all failed: ' + JSON.stringify(res))

    // 9: delete one
    res = await request('DELETE', `/api/${model}/delete/one`, { id: results.id1 })
    if (res.status !== 202) throw new Error('delete/one failed: ' + JSON.stringify(res))

    // 10: delete many
    res = await request('DELETE', `/api/${model}/delete/many`, { ids: [results.id2, results.id3] })
    if (res.status !== 202) throw new Error('delete/many failed: ' + JSON.stringify(res))

    // 11: delete all
    res = await request('DELETE', `/api/${model}/delete/all`)
    if (res.status !== 202) throw new Error('delete/all failed: ' + JSON.stringify(res))

    // 12: read all again (should be empty -> 404 or 200 with empty array depending)
    res = await request('GET', `/api/${model}/read/all`)
    if (res.status !== 200 && res.status !== 404) throw new Error('final read/all unexpected: ' + JSON.stringify(res))

    console.log('All 12 API endpoints passed.')
    process.exit(0)
  } catch (err) {
    console.error('Test failed:', err)
    process.exit(1)
  }
}

runTests().catch(err => { console.error(err); process.exit(1) })