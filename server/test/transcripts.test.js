import assert from 'node:assert/strict'
import { once } from 'node:events'
import { readFileSync } from 'node:fs'
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

test('updates a course grade, recalculates GPA, and persists the transcript', async () => {
  const transcriptURL = `${baseURL}/api/transcripts/1001`
  const originalResponse = await fetch(transcriptURL)
  const original = await originalResponse.json()

  try {
    const response = await fetch(`${transcriptURL}/grades`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseCode: 'CSC 101', term: 'Fall 2025', grade: 'F' }),
    })
    assert.equal(response.status, 200)
    const updated = await response.json()
    const updatedSemester = updated.semesters.find((semester) => semester.term === 'Fall 2025')
    assert.equal(updatedSemester.courses.find((course) => course.courseCode === 'CSC 101').grade, 'F')
    assert.equal(updatedSemester.gpa, 2.77)
    assert.equal(updatedSemester.creditsEarned, 10)
    assert.equal(updated.summary.cumulativeGPA, 2.5)
    assert.equal(updated.summary.creditsEarned, 23)

    const rosterResponse = await fetch(`${baseURL}/api/rosters/${encodeURIComponent('CSC 101')}`)
    const roster = await rosterResponse.json()
    const rosterStudent = roster.students.find((student) => student.studentID === '1001')
    assert.equal(rosterStudent.grade, 'F')
    assert.equal(rosterStudent.termGPA, 2.77)
    assert.equal(rosterStudent.cumulativeGPA, 2.5)

    const persistedData = JSON.parse(readFileSync(new URL('../src/data/transcripts.json', import.meta.url), 'utf8'))
    const persistedStudent = persistedData.students.find((student) => student.studentID === '1001')
    assert.equal(
      persistedStudent.semesters.find((semester) => semester.term === 'Fall 2025')
        .courses.find((course) => course.courseCode === 'CSC 101').grade,
      'F',
    )
  } finally {
    const restore = await fetch(`${transcriptURL}/grades`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseCode: 'CSC 101', term: 'Fall 2025', grade: 'B' }),
    })
    assert.equal(restore.status, 200)
    assert.deepEqual(await restore.json(), original)
  }
})

test('rejects invalid grade updates without changing the transcript', async () => {
  const response = await fetch(`${baseURL}/api/transcripts/1001/grades`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ courseCode: 'CSC 101', term: 'Fall 2025', grade: 'A+' }),
  })
  assert.equal(response.status, 400)
  assert.equal((await response.json()).error, 'INVALID_GRADE_UPDATE')
})

test('returns students, terms, and grades for a course code', async () => {
  const response = await fetch(`${baseURL}/api/rosters/${encodeURIComponent('csc 101')}`)
  assert.equal(response.status, 200)
  assert.match(response.headers.get('content-type'), /application\/json/)
  assert.deepEqual(await response.json(), {
    courseCode: 'CSC 101',
    courseTitle: 'Introduction to Computing',
    students: [
      { studentID: '1001', firstName: 'Avery', lastName: 'Morgan', term: 'Fall 2025', grade: 'B', termGPA: 3.46, cumulativeGPA: 2.85 },
      { studentID: '1002', firstName: 'Jordan', lastName: 'Bennett', term: 'Fall 2025', grade: 'D', termGPA: 1.92, cumulativeGPA: 1.31 },
      { studentID: '1003', firstName: 'Taylor', lastName: 'Reed', term: 'Fall 2025', grade: 'A', termGPA: 2.54, cumulativeGPA: 2.08 },
      { studentID: '1004', firstName: 'Cameron', lastName: 'Brooks', term: 'Fall 2025', grade: 'A', termGPA: 3.15, cumulativeGPA: 2.54 },
      { studentID: '1005', firstName: 'Riley', lastName: 'Parker', term: 'Fall 2025', grade: 'C', termGPA: 1.69, cumulativeGPA: 1.81 },
    ],
  })
})

test('returns JSON errors for malformed and unknown course codes', async () => {
  const malformed = await fetch(`${baseURL}/api/rosters/invalid`)
  assert.equal(malformed.status, 400)
  assert.equal((await malformed.json()).error, 'INVALID_COURSE_CODE')

  const unknown = await fetch(`${baseURL}/api/rosters/${encodeURIComponent('CSC 999')}`)
  assert.equal(unknown.status, 404)
  assert.equal((await unknown.json()).error, 'COURSE_NOT_FOUND')
})

test('supports frontend origins and preflight, including error responses', async () => {
  for (const path of ['/api/students', '/api/transcripts/1001', '/api/transcripts/9999', '/api/transcripts/invalid', '/api/rosters/CSC%20101', '/api/status']) {
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
  const rosterPreflight = await fetch(`${baseURL}/api/rosters/CSC%20101`, {
    method: 'OPTIONS',
    headers: { Origin: 'http://student-project.example', 'Access-Control-Request-Method': 'GET' },
  })
  assert.equal(rosterPreflight.status, 204)
  assert.match(rosterPreflight.headers.get('access-control-allow-methods'), /GET/)
  const gradePreflight = await fetch(`${baseURL}/api/transcripts/1001/grades`, {
    method: 'OPTIONS',
    headers: { Origin: 'http://student-project.example', 'Access-Control-Request-Method': 'PATCH' },
  })
  assert.equal(gradePreflight.status, 204)
  assert.match(gradePreflight.headers.get('access-control-allow-methods'), /PATCH/)
})

test('mock status works without PostgreSQL and unsupported write methods remain unavailable', async () => {
  const response = await fetch(`${baseURL}/api/status`)
  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), { status: 'ok', service: 'Mock transcript API', studentCount: 5 })
  const post = await fetch(`${baseURL}/api/transcripts/1001`, { method: 'POST' })
  assert.equal(post.status, 404)
  const root = await fetch(baseURL)
  assert.equal((await root.json()).message, 'CSC 425 API')
})
