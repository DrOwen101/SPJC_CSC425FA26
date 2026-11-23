import assert from 'node:assert/strict'
import { once } from 'node:events'
import { after, before, test } from 'node:test'
import { readFileSync } from 'node:fs'
import { app } from '../src/app.js'
import { pool } from '../src/db.js'

let server
let baseURL
const originalQuery = pool.query
const { students: fixtureStudents } = JSON.parse(
  readFileSync(new URL('../src/data/transcripts.json', import.meta.url), 'utf8'),
)
const courseGrades = new Map()
const scheduleEntries = []
let nextScheduleId = 1

before(async () => {
  pool.query = async (text, values = []) => {
    if (text.includes('SELECT NOW() AS current_time')) {
      return { rows: [{ current_time: new Date().toISOString() }] }
    }
    if (text.includes('COUNT(*)::int AS count FROM students')) {
      return { rows: [{ count: fixtureStudents.length }] }
    }
    if (text.includes('FROM students') && text.includes('ORDER BY student_id')) {
      return {
        rows: fixtureStudents.map(({ studentID, firstName, lastName, major }) => ({
          studentID,
          firstName,
          lastName,
          major,
        })),
      }
    }
    if (text.includes('JOIN transcripts t') && text.includes('WHERE s.student_id = $1')) {
      const student = fixtureStudents.find(({ studentID }) => studentID === values[0])
      return { rows: student ? [student] : [] }
    }
    if (text.includes('LEFT JOIN course_grades')) {
      return {
        rows: fixtureStudents.slice(0, 2).map((student) => ({
          studentID: student.studentID,
          firstName: student.firstName,
          lastName: student.lastName,
          major: student.major,
          grade: courseGrades.get(student.studentID) ?? null,
        })),
      }
    }
    if (text.includes('INSERT INTO course_grades')) {
      const [, studentID, grade] = values
      if (!['1001', '1002'].includes(studentID)) return { rows: [] }
      courseGrades.set(studentID, grade)
      return { rows: [{ studentID, grade }] }
    }
    if (text.includes('DELETE FROM faculty_schedule')) {
      const index = scheduleEntries.findIndex(({ scheduleId }) => String(scheduleId) === values[0])
      if (index < 0) return { rows: [] }
      const [removed] = scheduleEntries.splice(index, 1)
      return { rows: [{ scheduleId: removed.scheduleId }] }
    }
    if (text.includes('INSERT INTO faculty_schedule')) {
      const [meetingType, courseId, dayOfWeek, startTime, endTime, location] = values
      const duplicate = scheduleEntries.some((entry) => (
        entry.meetingType === meetingType
        && entry.courseId === courseId
        && entry.dayOfWeek === dayOfWeek
        && entry.startTime === startTime
        && entry.endTime === endTime
        && entry.location.trim().toLowerCase() === location.trim().toLowerCase()
      ))
      if (duplicate) {
        const error = new Error('Duplicate schedule entry')
        error.code = '23505'
        throw error
      }
      const schedule = {
        scheduleId: nextScheduleId++,
        meetingType,
        courseId,
        courseCode: meetingType === 'class' ? 'CSC425' : null,
        courseTitle: meetingType === 'class' ? 'Full Stack Development' : null,
        section: meetingType === 'class' ? '01' : null,
        dayOfWeek,
        startTime,
        endTime,
        location,
      }
      scheduleEntries.push(schedule)
      return { rows: [{ scheduleId: schedule.scheduleId }] }
    }
    if (text.includes('FROM faculty_schedule')) {
      return { rows: [...scheduleEntries] }
    }
    throw new Error(`Unexpected SQL in API test: ${text}`)
  }
  server = app.listen(0, '127.0.0.1')
  await once(server, 'listening')
  baseURL = `http://127.0.0.1:${server.address().port}`
})

after(async () => {
  if (server?.listening) {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
  }
  pool.query = originalQuery
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
  const facultyPreflight = await fetch(`${baseURL}/api/faculty/courses/1/grades/1001`, {
    method: 'OPTIONS',
    headers: { Origin: 'http://student-project.example', 'Access-Control-Request-Method': 'PUT' },
  })
  assert.equal(facultyPreflight.status, 204)
  assert.match(facultyPreflight.headers.get('access-control-allow-methods'), /PUT/)
})

test('database status reports student count and writes are not available', async () => {
  const response = await fetch(`${baseURL}/api/status`)
  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), {
    status: 'ok',
    service: 'PostgreSQL student transcript API',
    studentCount: 5,
  })
  const health = await fetch(`${baseURL}/api/health`)
  assert.equal(health.status, 200)
  const healthBody = await health.json()
  assert.equal(healthBody.status, 'ok')
  assert.equal(healthBody.database, 'connected')
  assert.equal(typeof healthBody.timestamp, 'string')
  const post = await fetch(`${baseURL}/api/transcripts/1001`, { method: 'POST' })
  assert.equal(post.status, 404)
  const root = await fetch(baseURL)
  assert.equal((await root.json()).message, 'CSC 425 API')
})

test('faculty can read and save final grades only for enrolled students', async () => {
  const grades = await fetch(`${baseURL}/api/faculty/courses/1/grades`)
  assert.equal(grades.status, 200)
  assert.deepEqual((await grades.json()).students.map(({ grade }) => grade), [null, null])

  const invalidGrade = await fetch(`${baseURL}/api/faculty/courses/1/grades/1001`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ grade: 'A+' }),
  })
  assert.equal(invalidGrade.status, 400)
  assert.equal((await invalidGrade.json()).error, 'INVALID_GRADE')

  const save = await fetch(`${baseURL}/api/faculty/courses/1/grades/1001`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ grade: 'A' }),
  })
  assert.equal(save.status, 200)
  assert.deepEqual((await save.json()).student, { studentID: '1001', grade: 'A' })

  const updated = await fetch(`${baseURL}/api/faculty/courses/1/grades`)
  assert.deepEqual((await updated.json()).students.map(({ grade }) => grade), ['A', null])
  const notEnrolled = await fetch(`${baseURL}/api/faculty/courses/1/grades/1003`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ grade: 'B' }),
  })
  assert.equal(notEnrolled.status, 404)
  assert.equal((await notEnrolled.json()).error, 'STUDENT_NOT_ENROLLED')
})

test('faculty can create, list, and remove class meetings and office hours', async () => {
  const invalid = await fetch(`${baseURL}/api/faculty/schedule`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      meetingType: 'class',
      courseId: 1,
      dayOfWeek: 'Monday',
      startTime: '11:00',
      endTime: '10:00',
      location: 'Room 12',
    }),
  })
  assert.equal(invalid.status, 400)
  assert.equal((await invalid.json()).error, 'INVALID_SCHEDULE_ENTRY')

  for (const entry of [
    { meetingType: 'class', courseId: 1, dayOfWeek: 'Monday', startTime: '09:00', endTime: '10:00', location: 'Room 12' },
    { meetingType: 'office_hours', courseId: null, dayOfWeek: 'Tuesday', startTime: '13:00', endTime: '14:00', location: 'Office 4' },
  ]) {
    const response = await fetch(`${baseURL}/api/faculty/schedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    })
    assert.equal(response.status, 201)
  }

  const duplicate = await fetch(`${baseURL}/api/faculty/schedule`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      meetingType: 'class',
      courseId: 1,
      dayOfWeek: 'Monday',
      startTime: '09:00',
      endTime: '10:00',
      location: ' room 12 ',
    }),
  })
  assert.equal(duplicate.status, 409)
  assert.deepEqual(await duplicate.json(), {
    error: 'DUPLICATE_SCHEDULE_ENTRY',
    message: 'This schedule entry already exists.',
  })

  const listed = await fetch(`${baseURL}/api/faculty/schedule`)
  assert.equal(listed.status, 200)
  const { schedule } = await listed.json()
  assert.equal(schedule.length, 2)
  assert.deepEqual(schedule.map(({ meetingType }) => meetingType), ['class', 'office_hours'])

  const removed = await fetch(`${baseURL}/api/faculty/schedule/${schedule[0].scheduleId}`, {
    method: 'DELETE',
  })
  assert.equal(removed.status, 204)
  const remaining = await fetch(`${baseURL}/api/faculty/schedule`)
  assert.equal((await remaining.json()).schedule.length, 1)
})
