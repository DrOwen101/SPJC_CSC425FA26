import assert from 'node:assert/strict'
import { once } from 'node:events'
import { test } from 'node:test'
import express from 'express'
import { createDashboardRouter, dashboardErrorHandler } from '../src/dashboardRoutes.js'

async function withApi(database, run) {
  const app = express()
  app.use(express.json())
  app.use('/api/dashboard', createDashboardRouter(database))
  app.use(dashboardErrorHandler)
  const server = app.listen(0, '127.0.0.1')
  await once(server, 'listening')
  try { await run(`http://127.0.0.1:${server.address().port}/api/dashboard`) }
  finally { await new Promise((resolve) => server.close(resolve)) }
}
const body = { firstName: 'Test', lastName: 'Fiction', email: 'test@example.com', majorId: 1, enrollmentYear: 2026, isActive: true }

test('invalid IDs, invalid bodies, and malformed JSON never reach SQL', async () => {
  let queries = 0
  await withApi({ query: async () => { queries++; throw new Error('Unexpected query') } }, async (url) => {
    for (const id of ['0', '-1', '1.5', 'abc', '2147483648']) {
      for (const method of ['GET', 'PUT', 'DELETE']) {
        assert.equal((await fetch(`${url}/students/${id}`, { method })).status, 400)
      }
    }
    for (const data of [null, {}, { ...body, isActive: 'false' }, { ...body, enrollmentYear: 1800 }, { ...body, firstName: ' ' }]) {
      assert.equal((await fetch(`${url}/students`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })).status, 400)
    }
    assert.equal((await fetch(`${url}/students`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{' })).status, 400)
    assert.equal(queries, 0)
  })
})
test('connection failure returns 503 instead of a successful save', async () => {
  await withApi({ query: async () => { throw Object.assign(new Error('connection unavailable'), { code: 'ECONNREFUSED' }) } }, async (url) => {
    const response = await fetch(`${url}/students`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    assert.equal(response.status, 503)
    assert.equal((await response.json()).error, 'DATABASE_UNAVAILABLE')
  })
})
test('duplicate email returns 409, and missing records return 404 for read/update/delete', async () => {
  await withApi({ query: async () => { throw Object.assign(new Error('duplicate'), { code: '23505' }) } }, async (url) => {
    assert.equal((await fetch(`${url}/students`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })).status, 409)
  })
  await withApi({ query: async () => ({ rows: [], rowCount: 0 }) }, async (url) => {
    for (const method of ['GET', 'PUT', 'DELETE']) {
      const response = await fetch(`${url}/students/42`, { method, ...(method === 'PUT' ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {}) })
      assert.equal(response.status, 404)
      assert.equal((await response.json()).error, 'STUDENT_NOT_FOUND')
    }
  })
})
