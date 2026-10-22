import assert from 'node:assert/strict'
import { once } from 'node:events'
import { after, before, test } from 'node:test'
import pg from 'pg'
import { createApp } from '../src/app.js'
import { pool, databaseConfig } from '../src/db.js'
import { setupDatabase } from '../database/setup.js'

// Every test uses a disposable DATABASE; the configured classroom data is never edited.
const testDatabase = `csc425_test_${process.pid}_${Date.now()}`
let database, server, baseURL, created = false
before(async () => {
  await pool.query(`CREATE DATABASE ${testDatabase}`)
  created = true
  database = new pg.Pool({ ...databaseConfig, database: testDatabase })
  await setupDatabase(database)
  server = createApp(database).listen(0, '127.0.0.1')
  await once(server, 'listening')
  baseURL = `http://127.0.0.1:${server.address().port}`
})
after(async () => {
  if (server?.listening) await new Promise((resolve) => server.close(resolve))
  if (database) await database.end()
  if (created) {
    const admin = await pool.connect()
    try {
      await admin.query('SET statement_timeout = 60000')
      await admin.query(`DROP DATABASE ${testDatabase} WITH (FORCE)`)
    } finally { admin.release() }
  }
  await pool.end()
})
async function request(path, method = 'GET', body, expected = 200) {
  const response = await fetch(`${baseURL}/api${path}`, { method, headers: { 'Content-Type': 'application/json' }, ...(body !== undefined && { body: JSON.stringify(body) }) })
  const data = response.status === 204 ? null : await response.json()
  assert.equal(response.status, expected, `${method} ${path}: ${JSON.stringify(data)}`)
  return data
}

test('seeded transcripts preserve all five students and calculate correct weighted GPA', async () => {
  const { students } = await request('/students')
  assert.deepEqual(students.map((s) => s.studentID), ['1001', '1002', '1003', '1004', '1005'])
  const points = { A: 4, B: 3, C: 2, D: 1, F: 0 }
  for (const student of students) {
    const transcript = await request(`/transcripts/${student.studentID}`)
    assert.equal(transcript.firstName, student.firstName)
    assert.equal(transcript.major, student.major)
    assert.equal(transcript.semesters.length, 2)
    let credits = 0, earned = 0, quality = 0
    for (const semester of transcript.semesters) {
      assert.equal(semester.courses.length, 4)
      const attempted = semester.courses.reduce((n, c) => n + c.creditHours, 0)
      const termEarned = semester.courses.reduce((n, c) => n + (c.grade === 'F' ? 0 : c.creditHours), 0)
      const termPoints = semester.courses.reduce((n, c) => n + c.creditHours * points[c.grade], 0)
      assert.equal(semester.creditsAttempted, attempted)
      assert.equal(semester.creditsEarned, termEarned)
      assert.equal(semester.gpa, Number((termPoints / attempted).toFixed(2)))
      credits += attempted; earned += termEarned; quality += termPoints
    }
    assert.deepEqual(transcript.summary, { creditsAttempted: credits, creditsEarned: earned, cumulativeGPA: Number((quality / credits).toFixed(2)) })
    assert.deepEqual(await request(`/transcripts?studentID=${student.studentID}`), transcript)
  }
})

test('student, course, enrollment, attendance, alert and GPA CRUD persists and respects ownership', async () => {
  const profile = { studentID: '9001', firstName: 'Test', lastName: 'Learner', major: 'Computing' }
  await request('/students', 'POST', profile, 201)
  const { studentID, ...update } = profile
  await request(`/students/${studentID}`, 'PUT', { ...update, firstName: "O'Brien" })
  assert.equal((await request('/students/9001')).record.firstName, "O'Brien")
  await request('/students', 'POST', profile, 409)
  const courseBody = { courseCode: 'TST 900', courseTitle: 'Integration testing', creditHours: 3 }
  const course = (await request('/courses', 'POST', courseBody, 201)).record
  await request(`/courses/${course.id}`, 'PUT', { ...courseBody, creditHours: 4 })
  const registration = { courseID: course.id, term: 'Test Term', status: 'upcoming', grade: null, meetingTime: 'Monday', location: 'Lab' }
  const enrollment = (await request('/students/9001/enrollments', 'POST', registration, 201)).record
  await request('/students/9001/enrollments', 'POST', registration, 409)
  await request(`/students/1001/enrollments/${enrollment.id}`, 'PUT', registration, 404)
  await request(`/students/1001/enrollments/${enrollment.id}`, 'DELETE', undefined, 404)
  const attendanceBody = { enrollmentID: enrollment.id, date: '2026-10-22', status: 'present' }
  await request('/students/1001/attendance', 'POST', attendanceBody, 400)
  const attendance = (await request('/students/9001/attendance', 'POST', attendanceBody, 201)).record
  assert.equal(attendance.date, '2026-10-22')
  await request(`/students/1001/attendance/${attendance.id}`, 'GET', undefined, 404)
  await request(`/students/9001/attendance/${attendance.id}`, 'PUT', { ...attendanceBody, status: 'late' })
  assert.equal((await request('/students/9001/attendance')).records[0].status, 'late')
  await request('/students/9001/attendance', 'POST', { ...attendanceBody, date: '2026-02-30' }, 400)
  await request('/students/9001/attendance', 'POST', attendanceBody, 409)
  await request(`/courses/${course.id}`, 'DELETE', undefined, 409)
  await request(`/students/9001/enrollments/${enrollment.id}`, 'PUT', { ...registration, status: 'completed', grade: 'B+' })
  assert.deepEqual((await request('/transcripts/9001')).summary, { creditsAttempted: 4, creditsEarned: 4, cumulativeGPA: 3.3 })
  await request(`/students/9001/enrollments/${enrollment.id}`, 'PUT', { ...registration, status: 'completed', grade: 'F' })
  assert.deepEqual((await request('/transcripts/9001')).summary, { creditsAttempted: 4, creditsEarned: 0, cumulativeGPA: 0 })
  for (const [resource, create, update] of [
    ['alerts', { message: 'Test reminder', dueDate: '2026-10-23', isRead: false }, { message: 'Updated reminder', dueDate: null, isRead: true }],
    ['gpa-entries', { grade: 'A-' }, { grade: 'B' }],
  ]) {
    const path = `/students/9001/${resource}`
    const record = (await request(path, 'POST', create, 201)).record
    await request(`${path}/${record.id}`, 'PUT', update)
    assert.deepEqual((await request(`${path}/${record.id}`)).record, { id: record.id, ...update })
    await request(`/students/1001/${resource}/${record.id}`, 'DELETE', undefined, 404)
    await request(`${path}/${record.id}`, 'DELETE', undefined, 204)
    assert.deepEqual((await request(path)).records, [])
  }
  await setupDatabase(database) // Rerunning migrations must not undo edits.
  assert.equal((await request('/students/9001')).record.firstName, "O'Brien")
  await request(`/students/9001/attendance/${attendance.id}`, 'DELETE', undefined, 204)
  await request('/students/9001/attendance', 'POST', attendanceBody, 201)
  await request(`/students/9001/enrollments/${enrollment.id}`, 'DELETE', undefined, 204)
  assert.deepEqual((await request('/students/9001/attendance')).records, [])
  assert.equal((await request('/transcripts/9001')).summary.creditsAttempted, 0)
  await request(`/courses/${course.id}`, 'DELETE', undefined, 204)
  await request('/students/9001/alerts', 'POST', { message: 'Cascade', isRead: false }, 201)
  await request('/students/9001', 'DELETE', undefined, 204)
  assert.equal((await database.query("SELECT count(*)::int AS count FROM student_dashboard.alerts WHERE student_id='9001'")).rows[0].count, 0)
  await request('/transcripts/9001', 'GET', undefined, 404)
})

test('rejects malformed IDs, JSON, invalid values, and unsupported input', async () => {
  for (const path of ['/transcripts', '/transcripts/abc', '/transcripts/100', '/transcripts?studentID=1001&studentID=1002']) {
    assert.equal((await request(path, 'GET', undefined, 400)).error, 'INVALID_STUDENT_ID')
  }
  await request('/transcripts/9999', 'GET', undefined, 404)
  for (const grade of ['toString', '__proto__', 'Z', 4]) await request('/students/1001/gpa-entries', 'POST', { grade }, 400)
  await request('/courses', 'POST', { courseCode: 'X', courseTitle: 'X', creditHours: -1 }, 400)
  await request('/students', 'POST', { studentID: '9002', firstName: ' ', lastName: 'X', major: 'X' }, 400)
  await request('/students/1001/alerts', 'POST', { message: 'X', isRead: 'false' }, 400)
  await request('/students/1001/gpa-entries', 'POST', { grade: 'A', studentID: '1002' }, 400)
  await request('/courses/1 OR 1=1', 'DELETE', undefined, 400)
  const invalid = await fetch(`${baseURL}/api/students`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{broken' })
  assert.equal(invalid.status, 400)
  assert.equal((await invalid.json()).error, 'INVALID_JSON')
})

test('health checks the schema and configured frontend can preflight all CRUD methods', async () => {
  assert.equal((await request('/health')).database, 'connected')
  const response = await fetch(`${baseURL}/api/students`, { method: 'OPTIONS', headers: { Origin: 'http://localhost:5173', 'Access-Control-Request-Method': 'PUT' } })
  assert.equal(response.status, 204)
  assert.equal(response.headers.get('access-control-allow-origin'), 'http://localhost:5173')
  assert.match(response.headers.get('access-control-allow-methods'), /PUT/)
  assert.match(response.headers.get('access-control-allow-methods'), /DELETE/)
})
