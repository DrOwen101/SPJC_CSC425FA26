import assert from 'node:assert/strict'
import { once } from 'node:events'
import { readFile } from 'node:fs/promises'
import { after, before, test } from 'node:test'
import express from 'express'
import pg from 'pg'
import { databaseConfig, pool } from '../src/db.js'
import { createAcademicRouter } from '../src/academicRoutes.js'
import { createStudentRecordsRouter } from '../src/studentRecordsRoutes.js'

// Exercise real SQL in a disposable database, never the user's student records.
const name = `csc425_transcript_test_${process.pid}_${Date.now()}`
const admin = new pg.Pool(databaseConfig)
let database, server, baseURL
let created = false
const sql = async (file) => readFile(new URL(`../database/${file}`, import.meta.url), 'utf8')
const request = (path, options) => fetch(`${baseURL}/api${path}`, options)

before(async () => {
  await admin.query(`CREATE DATABASE "${name}"`)
  created = true
  database = new pg.Pool({ ...databaseConfig, database: name })
  for (const file of ['001_student_records.sql', '002_sample_inserts.sql', '003_transcripts.sql']) {
    await database.query(await sql(file))
  }
  // A student outside the former hard-coded list must also get a transcript.
  await database.query(`INSERT INTO student_dashboard.students
    (first_name, last_name, email, major_id, enrollment_year)
    VALUES ('New', 'Student', 'new.student@example.test', 1, 2026)`)
  await database.query(await sql('004_transcript_samples.sql'))
  const app = express()
  app.use('/api', createAcademicRouter(database))
  app.use('/api/dashboard', createStudentRecordsRouter(database))
  server = app.listen(0, '127.0.0.1')
  await once(server, 'listening')
  baseURL = `http://127.0.0.1:${server.address().port}`
})

after(async () => {
  if (server?.listening) await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
  await database?.end()
  if (created) await admin.query(`DROP DATABASE "${name}" WITH (FORCE)`)
  await admin.end()
  await pool.end()
})

test('all database students have transcripts; names and totals match stored data', async () => {
  const response = await request('/students')
  assert.equal(response.status, 200)
  const { students } = await response.json()
  assert.equal(students.length, 4)
  const points = { A: 4, 'A-': 3.7, 'B+': 3.3, B: 3 }
  for (const student of students) {
    const fullName = `${student.firstName} ${student.lastName}`
    const lookup = await request(`/students?name=${encodeURIComponent(`  ${fullName.toUpperCase().replace(' ', '   ')}  `)}`)
    assert.deepEqual((await lookup.json()).students, [student])
    const result = await request(`/transcripts?name=${encodeURIComponent(fullName)}`)
    assert.equal(result.status, 200)
    const transcript = await result.json()
    assert.equal(transcript.studentID, student.studentID)
    assert.equal(transcript.major, student.major)
    assert.equal(transcript.isMockData, true)
    assert.equal(transcript.semesters.length, 2)
    let attempted = 0, quality = 0
    for (const term of transcript.semesters) {
      const credits = term.courses.reduce((sum, course) => sum + course.creditHours, 0)
      const termPoints = term.courses.reduce((sum, course) => sum + course.creditHours * points[course.grade], 0)
      assert.equal(term.creditsAttempted, credits)
      assert.equal(term.creditsEarned, credits)
      assert.equal(term.gpa, Number((termPoints / credits).toFixed(2)))
      attempted += credits
      quality += termPoints
    }
    assert.deepEqual(transcript.summary, { creditsAttempted: attempted, creditsEarned: attempted, cumulativeGPA: Number((quality / attempted).toFixed(2)) })
    assert.deepEqual(await (await request(`/transcripts/${student.studentID}`)).json(), transcript)
    assert.deepEqual(await (await request(`/transcripts?studentID=${student.studentID}`)).json(), transcript)
  }
})

test('rerunning the seed preserves records and only adds data for students without courses', async () => {
  await database.query("UPDATE student_dashboard.transcript_courses SET grade = 'F', is_sample = false WHERE student_id = 1 AND course_code = 'ENG101'")
  const beforeRows = (await database.query('SELECT * FROM student_dashboard.transcript_courses ORDER BY id')).rows
  await database.query(await sql('004_transcript_samples.sql'))
  assert.deepEqual((await database.query('SELECT * FROM student_dashboard.transcript_courses ORDER BY id')).rows, beforeRows)
  const transcript = await (await request('/transcripts/1')).json()
  assert.equal(transcript.summary.creditsAttempted, 20)
  assert.equal(transcript.summary.creditsEarned, 17)
  assert.equal(transcript.summary.cumulativeGPA, 2.95)
  assert.equal(transcript.semesters[0].gpa, 2.47)
})

test('search reads current database edits and distinguishes missing transcripts and duplicate names', async () => {
  await database.query("UPDATE student_dashboard.students SET first_name = 'Changed' WHERE id = 4")
  assert.equal((await (await request('/students?name=New%20Student')).json()).students.length, 0)
  assert.equal((await (await request('/students?name=Changed%20Student')).json()).students[0].studentID, '4')
  assert.equal((await request('/transcripts?name=Changed%20Student')).status, 200)
  const { rows: [student] } = await database.query(`INSERT INTO student_dashboard.students
    (first_name, last_name, email, major_id, enrollment_year)
    VALUES ('No', 'Transcript', 'no.transcript@example.test', 1, 2026) RETURNING id`)
  const missing = await request('/transcripts?name=No%20Transcript')
  assert.equal(missing.status, 404)
  assert.equal((await missing.json()).error, 'TRANSCRIPT_NOT_FOUND')
  await database.query(await sql('004_transcript_samples.sql'))
  assert.equal((await request(`/transcripts/${student.id}`)).status, 200)
  await database.query(`INSERT INTO student_dashboard.students
    (first_name, last_name, email, major_id, enrollment_year)
    VALUES ('Avery', 'Morgan', 'duplicate@example.test', 1, 2026)`)
  assert.equal((await (await request('/students?name=Avery%20Morgan')).json()).students.length, 2)
  const duplicate = await request('/transcripts?name=Avery%20Morgan')
  assert.equal(duplicate.status, 409)
  assert.equal((await duplicate.json()).error, 'AMBIGUOUS_NAME')
})

test('validates names and IDs and safely handles SQL-like input', async () => {
  for (const path of ['/transcripts', '/transcripts/abc', '/transcripts/0', '/transcripts/2147483648', '/transcripts?name=', '/transcripts?name=A&name=B', '/students?name=', '/transcripts?name=A&studentID=1']) {
    assert.equal((await request(path)).status, 400, path)
  }
  assert.equal((await request('/transcripts/999999')).status, 404)
  const result = await request(`/students?name=${encodeURIComponent("' OR 1=1 --")}`)
  assert.deepEqual(await result.json(), { students: [] })
})

test('students with transcript records cannot be deleted; invalid grades are rejected', async () => {
  const result = await request('/dashboard/students/1', { method: 'DELETE' })
  assert.equal(result.status, 409)
  assert.equal((await result.json()).error, 'STUDENT_HAS_TRANSCRIPT')
  await assert.rejects(database.query("UPDATE student_dashboard.transcript_courses SET grade = 'Z' WHERE student_id = 1"), { code: '23514' })
})

test('database failure returns 503 without fixture fallback or internal error details', async () => {
  const unavailable = express()
  unavailable.use('/api', createAcademicRouter({ query: async () => { throw Object.assign(new Error('private database details'), { code: 'ECONNREFUSED' }) } }))
  const failedServer = unavailable.listen(0, '127.0.0.1')
  await once(failedServer, 'listening')
  try {
    for (const path of ['/students?name=Avery%20Morgan', '/transcripts?name=Avery%20Morgan']) {
      const response = await fetch(`http://127.0.0.1:${failedServer.address().port}/api${path}`)
      assert.equal(response.status, 503)
      const data = await response.json()
      assert.equal(data.error, 'DATABASE_UNAVAILABLE')
      assert.ok(!data.message.includes('private'))
    }
  } finally {
    await new Promise((resolve) => failedServer.close(resolve))
  }
})
