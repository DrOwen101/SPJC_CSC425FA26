import assert from 'node:assert/strict'
import { once } from 'node:events'
import { after, before, test } from 'node:test'
import { app } from '../src/app.js'
import { pool } from '../src/db.js'

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

test('serves consistent transcripts for all five students with correct GPA totals', async () => {
  const students = [
    { studentID: '1001', firstName: 'Avery', lastName: 'Morgan', major: 'Computer Science' },
    { studentID: '1002', firstName: 'Jordan', lastName: 'Bennett', major: 'Information Systems' },
    { studentID: '1003', firstName: 'Taylor', lastName: 'Reed', major: 'Business Administration' },
    { studentID: '1004', firstName: 'Cameron', lastName: 'Brooks', major: 'Mathematics' },
    { studentID: '1005', firstName: 'Riley', lastName: 'Parker', major: 'Computer Science' },
  ]
  const gradePoints = { A: 4, B: 3, C: 2, D: 1, F: 0 }

  for (const student of students) {
    const result = await fetch(`${baseURL}/api/transcripts/${student.studentID}`)
    assert.equal(result.status, 200)
    assert.match(result.headers.get('content-type'), /application\/json/)
    const transcript = await result.json()
    assert.equal(transcript.studentID, student.studentID)
    assert.equal(transcript.firstName, student.firstName)
    assert.equal(transcript.lastName, student.lastName)
    assert.equal(transcript.major, student.major)
    assert.equal(transcript.isMockData, true)
    assert.equal(transcript.semesters.length, 2)
    let totalAttempted = 0
    let totalEarned = 0
    let totalQuality = 0

    for (const semester of transcript.semesters) {
      assert.equal(semester.courses.length, 4)
      let attempted = 0
      let earned = 0
      let quality = 0
      for (const course of semester.courses) {
        assert.ok(Object.hasOwn(gradePoints, course.grade))
        attempted += course.creditHours
        earned += course.grade === 'F' ? 0 : course.creditHours
        quality += course.creditHours * gradePoints[course.grade]
      }
      assert.equal(semester.creditsAttempted, attempted)
      assert.equal(semester.creditsEarned, earned)
      assert.equal(semester.gpa, Number((quality / attempted).toFixed(2)))
      totalAttempted += attempted
      totalEarned += earned
      totalQuality += quality
    }

    assert.deepEqual(transcript.summary, {
      creditsAttempted: totalAttempted,
      creditsEarned: totalEarned,
      cumulativeGPA: Number((totalQuality / totalAttempted).toFixed(2)),
    })
    const queryResult = await fetch(`${baseURL}/api/transcripts?studentID=${student.studentID}`)
    assert.equal(queryResult.status, 200)
    assert.deepEqual(await queryResult.json(), transcript)
  }
})

test('searches students by full name using the database', async (t) => {
  let query
  t.mock.method(pool, 'query', async (...args) => {
    query = args
    return {
      rows: [{ studentID: '1001', firstName: 'Avery', lastName: 'Morgan', major: 'Computer Science', institution: 'CSC 425 Demo University' }],
    }
  })

  const response = await fetch(`${baseURL}/api/students?name=%20Avery%20Morgan%20`)
  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), {
    students: [{ studentID: '1001', firstName: 'Avery', lastName: 'Morgan', major: 'Computer Science', institution: 'CSC 425 Demo University' }],
  })
  assert.equal(query[1][0], 'Avery Morgan')
  assert.match(query[0], /LOWER\(BTRIM\(firstName \|\| ' ' \|\| lastName\)\)/)
  assert.match(query[0], /\$1/)
  assert.match(query[0], /firstName AS "firstName"/)
  assert.match(query[0], /lastName AS "lastName"/)
})

test('creates student records through the database route', async (t) => {
  let query
  t.mock.method(pool, 'query', async (...args) => {
    query = args
    return {
      rows: [{ studentID: '1006', firstName: 'Casey', lastName: 'Diaz', major: '', institution: '' }],
    }
  })

  const response = await fetch(`${baseURL}/api/db/students`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      studentID: 1006,
      firstName: ' Casey ',
      lastName: 'Diaz',
      major: null,
      institution: null,
    }),
  })
  assert.equal(response.status, 201)
  assert.deepEqual(await response.json(), {
    studentID: '1006',
    firstName: 'Casey',
    lastName: 'Diaz',
    major: '',
    institution: '',
  })
  assert.deepEqual(query[1], [1006, 'Casey', 'Diaz', null, null])
  assert.match(query[0], /firstName AS "firstName"/)
  assert.match(query[0], /lastName AS "lastName"/)
})

test('validates new student data and reports duplicate IDs', async (t) => {
  let queryCalled = false
  let duplicateError = false
  t.mock.method(pool, 'query', async () => {
    queryCalled = true
    if (duplicateError) throw Object.assign(new Error('duplicate key'), { code: '23505' })
    return { rows: [] }
  })

  const invalid = await fetch(`${baseURL}/api/db/students`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ studentID: 0, firstName: '', lastName: 'Diaz' }),
  })
  assert.equal(invalid.status, 400)
  assert.deepEqual(await invalid.json(), { error: 'INVALID_STUDENT_DATA' })
  assert.equal(queryCalled, false)

  duplicateError = true
  const duplicate = await fetch(`${baseURL}/api/db/students`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ studentID: 1001, firstName: 'Avery', lastName: 'Morgan' }),
  })
  assert.equal(duplicate.status, 409)
  assert.deepEqual(await duplicate.json(), { error: 'STUDENT_ALREADY_EXISTS' })
})

test('updates a student record through the database route', async (t) => {
  let query
  t.mock.method(pool, 'query', async (...args) => {
    query = args
    return {
      rowCount: 1,
      rows: [{ studentID: '1001', firstName: 'Avery Jane', lastName: 'Morgan', major: 'Computer Science', institution: 'CSC 425 Demo University' }],
    }
  })

  const response = await fetch(`${baseURL}/api/db/students/1001`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      firstName: ' Avery Jane ',
      lastName: 'Morgan',
      major: 'Computer Science',
      institution: 'CSC 425 Demo University',
    }),
  })
  assert.equal(response.status, 200)
  assert.equal((await response.json()).firstName, 'Avery Jane')
  assert.deepEqual(query[1], ['Avery Jane', 'Morgan', 'Computer Science', 'CSC 425 Demo University', 1001])
})

test('validates update data and returns not found for missing students', async (t) => {
  let queryCalled = false
  t.mock.method(pool, 'query', async (...args) => {
    queryCalled = true
    return { rowCount: 0, rows: [] }
  })

  const invalid = await fetch(`${baseURL}/api/db/students/1001`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ firstName: '', lastName: 'Morgan', major: null, institution: null }),
  })
  assert.equal(invalid.status, 400)
  assert.deepEqual(await invalid.json(), { error: 'INVALID_STUDENT_DATA' })
  assert.equal(queryCalled, false)

  const missing = await fetch(`${baseURL}/api/db/students/9999`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ firstName: 'Avery', lastName: 'Morgan', major: null, institution: null }),
  })
  assert.equal(missing.status, 404)
  assert.deepEqual(await missing.json(), { error: 'STUDENT_NOT_FOUND' })
})

test('deletes a student record and reports missing or enrolled students', async (t) => {
  let deleteResult = { rowCount: 1, rows: [{ studentID: 1001 }] }
  t.mock.method(pool, 'query', async () => {
    if (deleteResult instanceof Error) throw deleteResult
    return deleteResult
  })

  const deleted = await fetch(`${baseURL}/api/db/students/1001`, { method: 'DELETE' })
  assert.equal(deleted.status, 204)

  deleteResult = { rowCount: 0, rows: [] }
  const missing = await fetch(`${baseURL}/api/db/students/9999`, { method: 'DELETE' })
  assert.equal(missing.status, 404)
  assert.deepEqual(await missing.json(), { error: 'STUDENT_NOT_FOUND' })

  deleteResult = Object.assign(new Error('foreign key violation'), { code: '23503' })
  const enrolled = await fetch(`${baseURL}/api/db/students/1002`, { method: 'DELETE' })
  assert.equal(enrolled.status, 409)
  assert.deepEqual(await enrolled.json(), { error: 'STUDENT_HAS_ENROLLMENTS' })
})

test('requires a valid full name for database student search', async () => {
  for (const path of ['/api/students', '/api/students?name=', '/api/students?name=   ', '/api/students?name=A&name=B']) {
    const response = await fetch(`${baseURL}${path}`)
    assert.equal(response.status, 400, path)
    assert.deepEqual(await response.json(), { error: 'INVALID_NAME' })
  }
})

test('returns JSON errors for missing, malformed, repeated, and unknown IDs', async () => {
  for (const path of ['/api/transcripts', '/api/transcripts/abc', '/api/transcripts/100', '/api/transcripts?studentID=', '/api/transcripts?studentID=1001&studentID=1002']) {
    const response = await fetch(`${baseURL}${path}`)
    assert.equal(response.status, 400, path)
    assert.equal((await response.json()).error, 'INVALID_STUDENT_ID')
  }
  const response = await fetch(`${baseURL}/api/transcripts/9999`)
  assert.equal(response.status, 404)
  assert.equal((await response.json()).error, 'STUDENT_NOT_FOUND')
})

test('supports frontend origins and preflight, including error responses', async () => {
  for (const path of ['/api/students', '/api/transcripts/1001', '/api/transcripts/9999', '/api/transcripts/invalid', '/api/status']) {
    const response = await fetch(`${baseURL}${path}`, { headers: { Origin: 'http://student-project.example' } })
    assert.equal(response.headers.get('access-control-allow-origin'), '*')
    await response.text()
  }
  const preflight = await fetch(`${baseURL}/api/transcripts/1001`, {
    method: 'OPTIONS',
    headers: { Origin: 'http://student-project.example', 'Access-Control-Request-Method': 'GET' },
  })
  assert.equal(preflight.status, 204)
  assert.match(preflight.headers.get('access-control-allow-methods'), /GET/)
})

test('mock status works without connecting to PostgreSQL and writes are not available', async () => {
  const response = await fetch(`${baseURL}/api/status`)
  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), { status: 'ok', service: 'Mock transcript API', studentCount: 5 })
  const post = await fetch(`${baseURL}/api/transcripts/1001`, { method: 'POST' })
  assert.equal(post.status, 404)
  const root = await fetch(baseURL)
  assert.equal((await root.json()).message, 'CSC 425 API')
})
