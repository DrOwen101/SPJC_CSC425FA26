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
  if (server?.listening) {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
  }
})

async function get(path, expectedStatus = 200) {
  const response = await fetch(`${baseURL}${path}`)
  assert.equal(response.status, expectedStatus, path)
  assert.match(response.headers.get('content-type'), /application\/json/)
  return response.json()
}

test('root advertises each attendance route and collection contains unique, valid records', async () => {
  const root = await get('/')
  for (const key of ['attendance', 'studentAttendance', 'attendanceRecord']) {
    await get(root.endpoints[key])
  }
  const collection = await get('/api/attendance')
  assert.equal(collection.isMockData, true)
  assert.equal(collection.courseCode, 'CSC425')
  assert.equal(collection.count, 12)
  assert.equal(collection.records.length, 12)
  assert.equal(new Set(collection.records.map((record) => `${record.studentID}/${record.date}`)).size, 12)
  for (const record of collection.records) {
    assert.ok(['present', 'late', 'absent'].includes(record.status))
    assert.match(record.studentID, /^\d{4}$/)
    assert.equal(new Date(record.date).toISOString().slice(0, 10), record.date)
    const single = await get(`/api/attendance/${record.studentID}/${record.date}`)
    assert.deepEqual(single.record, record)
    assert.equal(single.isMockData, true)
  }
})

test('all five student responses have accurate identities, records and summary calculations', async () => {
  const { students } = await get('/api/students')
  const collection = await get('/api/attendance')
  const expectedSummaries = [
    { total: 3, present: 1, late: 1, absent: 1, attendancePercentage: 66.67 },
    { total: 3, present: 3, late: 0, absent: 0, attendancePercentage: 100 },
    { total: 3, present: 1, late: 1, absent: 1, attendancePercentage: 66.67 },
    { total: 3, present: 0, late: 1, absent: 2, attendancePercentage: 33.33 },
    { total: 0, present: 0, late: 0, absent: 0, attendancePercentage: null },
  ]
  for (const [index, student] of students.entries()) {
    const result = await get(`/api/attendance/${student.studentID}`)
    assert.deepEqual(result.student, student)
    assert.deepEqual(result.records, collection.records.filter((record) => record.studentID === student.studentID))
    assert.deepEqual(result.summary, expectedSummaries[index])
  }
})

test('a recorded absence is 200; a valid missing record is 404 and never creates an absence', async () => {
  const before = await get('/api/attendance')
  assert.equal((await get('/api/attendance/1001/2026-10-16')).record.status, 'absent')
  for (const [id, date] of [['1001', '2026-10-19'], ['1005', '2026-10-12'], ['1001', '2028-02-29']]) {
    const result = await get(`/api/attendance/${id}/${date}`, 404)
    assert.deepEqual(result, {
      error: 'ATTENDANCE_NOT_FOUND',
      message: `No attendance record was found for studentID ${id} on ${date}.`,
      studentID: id,
      date,
    })
  }
  assert.equal((await get('/api/attendance/9999', 404)).error, 'STUDENT_NOT_FOUND')
  assert.equal((await get('/api/attendance/9999/2026-10-12', 404)).error, 'STUDENT_NOT_FOUND')
  assert.deepEqual(await get('/api/attendance'), before)
})

test('malformed IDs and impossible dates return 400 before data lookup', async () => {
  for (const id of ['abc', '100', '10000', '-100', '%201001']) {
    assert.equal((await get(`/api/attendance/${id}`, 400)).error, 'INVALID_STUDENT_ID')
  }
  for (const date of ['2026-02-29', '2026-04-31', '2026-13-01', '2026-00-12', '2026-10-00', '2026-1-2', 'yesterday']) {
    assert.equal((await get(`/api/attendance/1001/${date}`, 400)).error, 'INVALID_DATE')
  }
  assert.equal((await get('/api/attendance/9999/2026-02-30', 400)).error, 'INVALID_DATE')
  assert.equal((await get('/api/attendance/1001/2026-10-12/extra', 404)).error, 'ROUTE_NOT_FOUND')
})

test('CORS covers success and errors; HEAD and OPTIONS work; writes cannot mutate records', async () => {
  for (const path of ['', '/1001', '/abc', '/1001/2026-10-19', '/9999']) {
    const response = await fetch(`${baseURL}/api/attendance${path}`, { headers: { Origin: 'http://student-project.example' } })
    assert.equal(response.headers.get('access-control-allow-origin'), '*')
    await response.text()
  }
  const preflight = await fetch(`${baseURL}/api/attendance/1001`, {
    method: 'OPTIONS',
    headers: { Origin: 'http://student-project.example', 'Access-Control-Request-Method': 'GET' },
  })
  assert.equal(preflight.status, 204)
  assert.equal(preflight.headers.get('access-control-allow-methods'), 'GET,HEAD,OPTIONS')
  const head = await fetch(`${baseURL}/api/attendance/1001`, { method: 'HEAD' })
  assert.equal(head.status, 200)
  assert.equal(await head.text(), '')
  const before = await get('/api/attendance')
  for (const method of ['POST', 'PUT', 'PATCH', 'DELETE']) {
    const response = await fetch(`${baseURL}/api/attendance/1001/2026-10-12`, { method })
    assert.equal(response.status, 405)
    assert.equal(response.headers.get('allow'), 'GET, HEAD, OPTIONS')
    assert.equal((await response.json()).error, 'METHOD_NOT_ALLOWED')
  }
  assert.deepEqual(await get('/api/attendance'), before)
})
