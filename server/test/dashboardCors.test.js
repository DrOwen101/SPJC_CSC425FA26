import assert from 'node:assert/strict'
import { once } from 'node:events'
import { after, before, test } from 'node:test'
import { app } from '../src/app.js'

let server
let baseURL
before(async () => {
  server = app.listen(0, '127.0.0.1')
  await once(server, 'listening')
  baseURL = `http://127.0.0.1:${server.address().port}`
})
after(async () => {
  await new Promise((resolve) => server.close(resolve))
})

test('local dashboard ports can read API responses and preflight CRUD writes', async () => {
  for (const origin of ['http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174']) {
    // The root endpoint uses the same CORS middleware without accessing PostgreSQL.
    const read = await fetch(`${baseURL}/`, { headers: { Origin: origin } })
    assert.equal(read.status, 200)
    assert.equal(read.headers.get('access-control-allow-origin'), origin)
    assert.match(read.headers.get('vary'), /Origin/)
    for (const method of ['POST', 'PUT', 'DELETE']) {
      const preflight = await fetch(`${baseURL}/api/dashboard/students/1`, {
        method: 'OPTIONS',
        headers: { Origin: origin, 'Access-Control-Request-Method': method, 'Access-Control-Request-Headers': 'content-type' },
      })
      assert.equal(preflight.status, 204)
      assert.equal(preflight.headers.get('access-control-allow-origin'), origin)
      assert.ok(preflight.headers.get('access-control-allow-methods').split(',').includes(method))
      assert.match(preflight.headers.get('access-control-allow-headers'), /content-type/i)
    }
  }
})
test('other origins do not receive dashboard CORS access', async () => {
  for (const origin of ['https://unrelated.example', 'http://localhost:5175']) {
    const response = await fetch(`${baseURL}/`, { headers: { Origin: origin } })
    assert.equal(response.headers.get('access-control-allow-origin'), null)
  }
})
