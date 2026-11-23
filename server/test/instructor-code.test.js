import assert from 'node:assert/strict'
import { once } from 'node:events'
import express from 'express'
import { after, before, test } from 'node:test'
import { createAcademicRouter } from '../src/academicRoutes.js'

let server
let baseURL
const submittedCodes = []
const database = {
  async query(sql, parameters) {
    assert.match(sql, /public\.instructorcodes/)
    assert.match(sql, /btrim\(instructorcode\) = \$1/)
    submittedCodes.push(parameters[0])
    return { rows: [{ valid: parameters[0] === 'A123' }] }
  },
}

before(async () => {
  const app = express()
  app.use('/api', createAcademicRouter(database))
  server = app.listen(0, '127.0.0.1')
  await once(server, 'listening')
  baseURL = `http://127.0.0.1:${server.address().port}`
})

after(async () => {
  if (server?.listening) {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
  }
})

test('validates instructor codes without returning the stored code', async () => {
  const response = await fetch(`${baseURL}/api/auth/instructor-code`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ code: 'A123' }),
  })

  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), { valid: true })
  assert.deepEqual(submittedCodes, ['A123'])
})

test('denies unknown instructor codes and rejects oversized input', async () => {
  const denied = await fetch(`${baseURL}/api/auth/instructor-code`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ code: 'X999' }),
  })

  assert.equal(denied.status, 401)
  assert.deepEqual(await denied.json(), {
    error: 'ACCESS_DENIED',
    message: 'Access Denied',
  })

  const countBeforeInvalidInput = submittedCodes.length
  const invalid = await fetch(`${baseURL}/api/auth/instructor-code`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ code: 'TOOLONG' }),
  })

  assert.equal(invalid.status, 400)
  assert.equal((await invalid.json()).error, 'INVALID_INPUT')
  assert.equal(submittedCodes.length, countBeforeInvalidInput)
})
