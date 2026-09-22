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

test('lists exactly five students and serves consistent transcripts with correct GPA totals', async () => {
  const response = await fetch(`${baseURL}/api/students`)
  assert.equal(response.status, 200)
  const { students } = await response.json()
  assert.deepEqual(students.map((student) => student.studentID), ['1001', '1002', '1003', '1004', '1005'])
  const gradePoints = { A: 4, B: 3, C: 2, D: 1, F: 0 }

  for (const student of students) {
    const result = await fetch(`${baseURL}/api/transcripts/${student.studentID}`)
    assert.equal(result.status, 200)
    assert.match(result.headers.get('content-type'), /application\/json/)
    const transcript = await result.json()
    assert.equal(transcript.studentID, student.studentID)
    assert.equal(transcript.firstName, student.firstName)
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
