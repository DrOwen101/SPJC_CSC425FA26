import express from 'express'
import { pool } from './db.js'

// Lab 10: student records stored in PostgreSQL (student_dashboard schema).
// Every query uses $1, $2... placeholders, so request values are never
// pasted into the SQL text.
export const dashboardRouter = express.Router()

// Columns returned for a student, renamed to the camelCase the frontend uses.
const STUDENT_COLUMNS = `
  s.id, s.first_name AS "firstName", s.last_name AS "lastName", s.email,
  s.major_id AS "majorId", m.name AS "majorName",
  s.enrollment_year AS "enrollmentYear", s.is_active AS "isActive",
  s.created_at AS "createdAt", s.updated_at AS "updatedAt"`

// Wraps a handler so any thrown or database error goes to the error handler below.
const handle = (fn) => (request, response, next) => fn(request, response).catch(next)

function badRequest(message) {
  return Object.assign(new Error(message), { status: 400 })
}

// The id must be a whole number from 1 up, so a bad id can never match the
// wrong row or every row.
function parseId(value) {
  if (!/^[1-9][0-9]{0,9}$/.test(value) || Number(value) > 2147483647) {
    throw badRequest('The student id must be a positive whole number.')
  }
  return Number(value)
}

// Checks every field on the server, no matter what the frontend already checked.
function parseStudent(body) {
  if (!body || typeof body !== 'object') throw badRequest('Send the student as a JSON object.')
  const { firstName, lastName, email, majorId, enrollmentYear, isActive } = body
  for (const [label, value] of [['First name', firstName], ['Last name', lastName]]) {
    if (typeof value !== 'string' || !value.trim() || value.trim().length > 60) {
      throw badRequest(`${label} must be 1 to 60 characters.`)
    }
  }
  if (typeof email !== 'string' || email.trim().length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    throw badRequest('Enter a valid email address.')
  }
  if (!Number.isInteger(majorId) || majorId < 1) throw badRequest('Choose a major.')
  if (!Number.isInteger(enrollmentYear) || enrollmentYear < 2000 || enrollmentYear > 2100) {
    throw badRequest('Enrollment year must be between 2000 and 2100.')
  }
  if (typeof isActive !== 'boolean') throw badRequest('Active must be true or false.')
  return {
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    email: email.trim().toLowerCase(),
    majorId,
    enrollmentYear,
    isActive,
  }
}

function notFound(response, id) {
  return response.status(404).json({ error: `No student found with id ${id}.` })
}

// GET /api/dashboard/majors → every major, for the dropdown
dashboardRouter.get('/majors', handle(async (_request, response) => {
  const result = await pool.query('SELECT id, code, name FROM student_dashboard.majors ORDER BY name')
  response.json({ majors: result.rows })
}))

// GET /api/dashboard/students → every student
dashboardRouter.get('/students', handle(async (_request, response) => {
  const result = await pool.query(`SELECT ${STUDENT_COLUMNS}
    FROM student_dashboard.students s
    JOIN student_dashboard.majors m ON m.id = s.major_id
    ORDER BY s.id`)
  response.json({ students: result.rows })
}))

// GET /api/dashboard/students/:id → one student by primary key
dashboardRouter.get('/students/:id', handle(async (request, response) => {
  const id = parseId(request.params.id)
  const result = await pool.query(`SELECT ${STUDENT_COLUMNS}
    FROM student_dashboard.students s
    JOIN student_dashboard.majors m ON m.id = s.major_id
    WHERE s.id = $1`, [id])
  if (result.rowCount === 0) return notFound(response, id)
  response.json({ student: result.rows[0] })
}))

// POST /api/dashboard/students → create a student, return it with its new id
dashboardRouter.post('/students', handle(async (request, response) => {
  const s = parseStudent(request.body)
  const result = await pool.query(`WITH saved AS (
      INSERT INTO student_dashboard.students (first_name, last_name, email, major_id, enrollment_year, is_active)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    )
    SELECT ${STUDENT_COLUMNS} FROM saved s JOIN student_dashboard.majors m ON m.id = s.major_id`,
  [s.firstName, s.lastName, s.email, s.majorId, s.enrollmentYear, s.isActive])
  response.status(201).json({ student: result.rows[0] })
}))

// PUT /api/dashboard/students/:id → replace one student's values
dashboardRouter.put('/students/:id', handle(async (request, response) => {
  const id = parseId(request.params.id)
  const s = parseStudent(request.body)
  // WHERE uses the primary key, so at most one row can change.
  const result = await pool.query(`WITH saved AS (
      UPDATE student_dashboard.students
      SET first_name = $1, last_name = $2, email = $3, major_id = $4,
          enrollment_year = $5, is_active = $6, updated_at = clock_timestamp()
      WHERE id = $7
      RETURNING *
    )
    SELECT ${STUDENT_COLUMNS} FROM saved s JOIN student_dashboard.majors m ON m.id = s.major_id`,
  [s.firstName, s.lastName, s.email, s.majorId, s.enrollmentYear, s.isActive, id])
  if (result.rowCount === 0) return notFound(response, id)
  response.json({ student: result.rows[0] })
}))

// DELETE /api/dashboard/students/:id → remove one student
dashboardRouter.delete('/students/:id', handle(async (request, response) => {
  const id = parseId(request.params.id)
  const result = await pool.query('DELETE FROM student_dashboard.students WHERE id = $1 RETURNING id', [id])
  if (result.rowCount === 0) return notFound(response, id)
  response.json({ deletedId: result.rows[0].id })
}))

// Turns every failure into a clear status code, so the frontend never sees a
// fake success. SQL text and passwords are never sent to the browser.
// eslint-disable-next-line no-unused-vars
dashboardRouter.use((error, _request, response, _next) => {
  if (error.status === 400) return response.status(400).json({ error: error.message })
  if (error.type === 'entity.parse.failed') return response.status(400).json({ error: 'The request body is not valid JSON.' })
  if (error.code === '23505') return response.status(409).json({ error: 'A student with that email already exists.' })
  if (error.code === '23503') return response.status(409).json({ error: 'That major does not exist. Reload the page and choose another.' })
  if (['23514', '23502', '22001', '22P02'].includes(error.code)) {
    return response.status(400).json({ error: 'One of the values is not allowed by the database.' })
  }
  console.error('Dashboard student request failed:', error.code || error.name, error.message)
  response.status(503).json({ error: 'The database is unavailable. Nothing was saved. Please try again.' })
})
