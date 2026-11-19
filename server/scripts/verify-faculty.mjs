import assert from 'node:assert/strict'
import { randomInt } from 'node:crypto'
import { once } from 'node:events'
import { readFile } from 'node:fs/promises'
import { app } from '../src/app.js'
import { pool } from '../src/db.js'

const accounts = JSON.parse(await readFile(new URL('../.env.lab12-accounts', import.meta.url), 'utf8'))
const server = app.listen(0, '127.0.0.1')
await once(server, 'listening')
const base = `http://127.0.0.1:${server.address().port}/api`
const section = 'CSC125-01'
const otherSection = 'MAT150-01'
const date = `2099-12-${String(randomInt(1, 32)).padStart(2, '0')}`
const attendance = '/faculty/sections/' + section + '/attendance'
const entries = [{ studentId: 1201, status: 'present' }, { studentId: 1202, status: 'excused' }]
let cleanup = false

async function request(path, expected, { token, method = 'GET', body } = {}) {
  const headers = {}
  if (token) headers.Authorization = `Bearer ${token}`
  if (body) headers['Content-Type'] = 'application/json'
  const response = await fetch(base + path, { method, headers, body: body ? JSON.stringify(body) : undefined })
  const data = response.status === 204 ? null : await response.json()
  assert.equal(response.status, expected, `${method} ${path}: ${data?.message ?? 'unexpected status'}`)
  return data
}

async function login(username) {
  const { password } = accounts.find((account) => account.username === username)
  return request('/faculty/session', 200, { method: 'POST', body: { username, password } })
}

async function getSaved() {
  const { rows } = await pool.query(`
    SELECT student_id AS "studentId", status FROM faculty_dashboard.attendance
    WHERE section_id = $1 AND meeting_date = $2 ORDER BY student_id
  `, [section, date])
  return rows
}

try {
  // Reject unauthenticated users and a real student-role session.
  await request('/faculty/sections', 401)
  await request(attendance, 401, { method: 'PUT', body: { date, entries } })
  await request('/faculty/sections', 401, { token: 'a'.repeat(64) })
  const student = await login('student-demo')
  assert.equal(student.user.role, 'student')
  for (const path of ['/faculty/sections', '/faculty/students?q=1201', `/faculty/sections/${section}/grades`, `${attendance}?date=${date}`]) {
    await request(path, 403, { token: student.token })
  }
  await request(attendance, 403, { token: student.token, method: 'PUT', body: { date, entries } })
  console.log('PASS: missing/invalid sessions get 401. A signed-in student gets 403 on every faculty data route.')

  const { token, user } = await login('faculty-demo')
  assert.equal(user.role, 'faculty')
  const options = { token }
  const { sections } = await request('/faculty/sections', 200, options)
  assert.deepEqual(sections.map((item) => item.id), ['CSC125-01', 'CSC210-02'])
  assert.equal(sections[0].location, 'Technology 204')
  assert.equal(sections[0].studentCount, 3)
  const other = await login('faculty-other')
  assert.deepEqual((await request('/faculty/sections', 200, { token: other.token })).sections.map((item) => item.id), [otherSection])
  await request(`/faculty/sections/${otherSection}/grades`, 404, options)
  await request(`/faculty/sections/${otherSection}/attendance?date=${date}`, 404, options)
  await request(`/faculty/sections/${otherSection}/attendance`, 404, { ...options, method: 'PUT', body: { date, entries } })
  console.log('PASS: faculty see their own teaching schedules. Another instructor’s section rejects reads and writes.')

  const { students } = await request('/faculty/students?q=Robin', 200, options)
  assert.deepEqual(students.map((item) => [item.id, item.sections]), [[1201, ['CSC125-01', 'CSC210-02']]])
  assert.deepEqual((await request('/faculty/students?q=1204', 200, options)).students, [])
  const { grades } = await request(`/faculty/sections/${section}/grades`, 200, options)
  assert.equal(grades.find((item) => item.studentId === 1201).percentage, 86)
  assert.equal(grades.find((item) => item.studentId === 1203).percentage, null)
  console.log('PASS: roster lookup scopes name/ID matches. Grade summary calculates 43 / 50 as 86% and handles ungraded work.')

  assert.deepEqual(await getSaved(), [], 'Pick a fresh test date before writing.')
  const initial = await request(`${attendance}?date=${date}`, 200, options)
  assert.equal(initial.roster.length, 3)
  assert.ok(initial.roster.every((item) => item.status === null))
  await request(attendance, 400, { ...options, method: 'PUT', body: { date: '2099-02-31', entries } })
  await request(attendance, 400, { ...options, method: 'PUT', body: { date, entries: [{ studentId: 1201, status: 'unknown' }] } })
  await request(attendance, 400, { ...options, method: 'PUT', body: { date, entries: [...entries, { studentId: 1204, status: 'present' }] } })
  assert.deepEqual(await getSaved(), [], 'Rejected attendance should leave the table unchanged.')
  cleanup = true
  const saved = await request(attendance, 200, { ...options, method: 'PUT', body: { date, entries } })
  assert.equal(saved.saved, entries.length)
  assert.deepEqual(await getSaved(), entries)
  const updated = [{ studentId: 1201, status: 'late' }]
  await request(attendance, 200, { ...options, method: 'PUT', body: { date, entries: updated } })
  assert.deepEqual(await getSaved(), [updated[0], entries[1]])
  const reread = await request(`${attendance}?date=${date}`, 200, options)
  assert.equal(reread.roster.find((item) => item.studentId === 1201).status, 'late')
  console.log(`PASS: attendance for 1201 persisted, updated and returned in a fresh GET and direct SQL query (${date}).`)

  await request('/faculty/session', 204, { ...options, method: 'DELETE' })
  await request('/faculty/sections', 401, options)
  const majors = await request('/dashboard/majors', 200)
  assert.ok(majors.majors.length > 0)
  assert.ok((await request('/students', 200)).students.length > 0)
  assert.equal((await request('/transcripts/1001', 200)).studentID, '1001')
  console.log('PASS: sign-out revokes the faculty token. Student majors, lookup and transcript remain available.')
} finally {
  try {
    if (cleanup) await pool.query(`
      DELETE FROM faculty_dashboard.attendance
      WHERE section_id = $1 AND meeting_date = $2 AND student_id = ANY($3::int[])
    `, [section, date, entries.map((entry) => entry.studentId)])
  } finally {
    server.close()
    await pool.end()
  }
}
