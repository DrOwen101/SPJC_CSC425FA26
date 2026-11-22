import assert from 'node:assert/strict'
import { once } from 'node:events'
import { after, before, test } from 'node:test'
import { app } from '../src/app.js'
import { pool } from '../src/db.js'

let server
let baseURL
const facultyToken = process.env.FACULTY_API_TOKEN

before(async () => {
  server = app.listen(0, '127.0.0.1')
  await once(server, 'listening')
  baseURL = `http://127.0.0.1:${server.address().port}`
})

after(async () => {
  if (server?.listening) {
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())))
  }
  await pool.end()
})

test('rejects unauthorized requests without faculty credentials', async () => {
  const response = await fetch(`${baseURL}/api/faculty/grades/1`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ grade: 'A' }),
  })

  assert.equal(response.status, 403)
  const data = await response.json()
  assert.equal(data.error, 'FACULTY_ACCESS_REQUIRED')
})

test('rejects requests with an invalid Bearer token', async () => {
  const response = await fetch(`${baseURL}/api/faculty/grades/1`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer invalid_token_123',
    },
    body: JSON.stringify({ grade: 'A' }),
  })

  assert.equal(response.status, 403)
  const data = await response.json()
  assert.equal(data.error, 'FACULTY_ACCESS_REQUIRED')
})

test('returns 400 for invalid enrollment IDs', async () => {
  const invalidIds = ['abc', '0', '-5', 'NaN', '1.5']

  for (const id of invalidIds) {
    const response = await fetch(`${baseURL}/api/faculty/grades/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${facultyToken}`,
      },
      body: JSON.stringify({ grade: 'A' }),
    })

    assert.equal(response.status, 400, `Expected 400 for enrollment ID: ${id}`)
    const data = await response.json()
    assert.equal(data.error, 'INVALID_ENROLLMENT_ID')
  }
})

test('returns 400 for invalid grades', async () => {
  const invalidGrades = ['X', 'A+', '', 123, null, undefined, 'f', 'pass']

  for (const grade of invalidGrades) {
    const response = await fetch(`${baseURL}/api/faculty/grades/1`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${facultyToken}`,
      },
      body: JSON.stringify({ grade }),
    })

    assert.equal(response.status, 400, `Expected 400 for grade: ${grade}`)
    const data = await response.json()
    assert.equal(data.error, 'INVALID_GRADE')
  }
})

test('returns 404 for a nonexistent enrollment ID', async () => {
  const response = await fetch(`${baseURL}/api/faculty/grades/999999`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${facultyToken}`,
    },
    body: JSON.stringify({ grade: 'B' }),
  })

  assert.equal(response.status, 404)
  const data = await response.json()
  assert.equal(data.error, 'ENROLLMENT_NOT_FOUND')
})

test('successfully updates a grade using Bearer token, persists to DB, and restores original grade', async () => {
  // Retrieve an existing enrollment from DB
  const initialResult = await pool.query(
    'SELECT enrollment_id, grade FROM enrollments ORDER BY enrollment_id LIMIT 1'
  )
  assert.ok(initialResult.rows.length > 0, 'At least one enrollment should exist')

  const targetEnrollment = initialResult.rows[0]
  const targetId = targetEnrollment.enrollment_id
  const originalGrade = targetEnrollment.grade

  // Choose a new grade different from the current one
  const newGrade = originalGrade === 'A' ? 'B' : 'A'

  try {
    const response = await fetch(`${baseURL}/api/faculty/grades/${targetId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${facultyToken}`,
      },
      body: JSON.stringify({ grade: newGrade }),
    })

    assert.equal(response.status, 200)
    const data = await response.json()
    assert.equal(data.message, 'Grade updated successfully.')
    assert.equal(data.enrollment.enrollment_id, targetId)
    assert.equal(data.enrollment.grade, newGrade)

    // Direct database read-after-write check
    const checkResult = await pool.query(
      'SELECT grade FROM enrollments WHERE enrollment_id = $1',
      [targetId]
    )
    assert.equal(checkResult.rows[0].grade, newGrade)
  } finally {
    // Restore original grade
    await pool.query(
      'UPDATE enrollments SET grade = $1 WHERE enrollment_id = $2',
      [originalGrade, targetId]
    )

    // Confirm restoration
    const restoredResult = await pool.query(
      'SELECT grade FROM enrollments WHERE enrollment_id = $1',
      [targetId]
    )
    assert.equal(restoredResult.rows[0].grade, originalGrade)
  }
})

test('successfully updates a grade using session authentication', async () => {
  // 1. Log in via session
  const loginResponse = await fetch(`${baseURL}/api/faculty/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: facultyToken }),
  })
  assert.equal(loginResponse.status, 200)

  const rawCookie = loginResponse.headers.get('set-cookie')
  assert.ok(rawCookie, 'Expected session cookie to be set')
  const sessionCookie = rawCookie.split(';')[0]

  // Retrieve an existing enrollment
  const initialResult = await pool.query(
    'SELECT enrollment_id, grade FROM enrollments ORDER BY enrollment_id LIMIT 1'
  )
  const targetId = initialResult.rows[0].enrollment_id
  const originalGrade = initialResult.rows[0].grade
  const newGrade = originalGrade === 'C' ? 'B' : 'C'

  try {
    const updateResponse = await fetch(`${baseURL}/api/faculty/grades/${targetId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: sessionCookie,
      },
      body: JSON.stringify({ grade: newGrade }),
    })

    assert.equal(updateResponse.status, 200)
    const updateData = await updateResponse.json()
    assert.equal(updateData.message, 'Grade updated successfully.')
    assert.equal(updateData.enrollment.grade, newGrade)

    // Check persistence
    const checkResult = await pool.query(
      'SELECT grade FROM enrollments WHERE enrollment_id = $1',
      [targetId]
    )
    assert.equal(checkResult.rows[0].grade, newGrade)
  } finally {
    // Restore original grade
    await pool.query(
      'UPDATE enrollments SET grade = $1 WHERE enrollment_id = $2',
      [originalGrade, targetId]
    )
  }
})
