import { Router } from 'express'
import { pool } from './db.js'

const fields = `s.id, s.first_name AS "firstName", s.last_name AS "lastName",
  s.email, s.major_id AS "majorId", m.name AS "majorName",
  s.enrollment_year AS "enrollmentYear", s.is_active AS "isActive",
  s.created_at AS "createdAt", s.updated_at AS "updatedAt"`
const joinedStudents = `SELECT ${fields} FROM student_dashboard.students s
  JOIN student_dashboard.majors m ON m.id = s.major_id`

function validId(value) {
  return /^\d+$/.test(value) && Number.isSafeInteger(Number(value))
    && Number(value) > 0 && Number(value) <= 2147483647
}

function validateStudent(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null
  const { firstName, lastName, email, majorId, enrollmentYear, isActive } = body
  if (typeof firstName !== 'string' || !firstName.trim() || firstName.trim().length > 80
    || typeof lastName !== 'string' || !lastName.trim() || lastName.trim().length > 80
    || typeof email !== 'string' || email.trim().length > 254
    || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    || !Number.isInteger(majorId) || !validId(String(majorId))
    || !Number.isInteger(enrollmentYear) || enrollmentYear < 1900 || enrollmentYear > 2100
    || typeof isActive !== 'boolean') return null
  return [firstName.trim(), lastName.trim(), email.trim().toLowerCase(), majorId, enrollmentYear, isActive]
}

// Injection of a query-capable database makes failure handling testable.
export function createDashboardRouter(database = pool) {
  const router = Router()
  router.use((_req, res, next) => {
    res.set('Cache-Control', 'no-store')
    next()
  })
  router.param('id', (req, res, next, id) => {
    if (!validId(id)) return res.status(400).json({ error: 'INVALID_ID', message: 'Use a positive integer student ID.' })
    next()
  })

  router.get('/majors', async (_req, res) => {
    const result = await database.query('SELECT id, code, name FROM student_dashboard.majors ORDER BY name')
    res.json({ majors: result.rows })
  })
  router.get('/students', async (_req, res) => {
    res.json({ students: (await database.query(`${joinedStudents} ORDER BY s.id`)).rows })
  })
  router.get('/students/:id', async (req, res) => {
    const result = await database.query(`${joinedStudents} WHERE s.id = $1`, [Number(req.params.id)])
    if (!result.rowCount) return notFound(res, req.params.id)
    res.json({ student: result.rows[0] })
  })
  router.post('/students', async (req, res) => {
    const values = validateStudent(req.body)
    if (!values) return invalidBody(res)
    const result = await database.query(`WITH saved AS (
      INSERT INTO student_dashboard.students
        (first_name, last_name, email, major_id, enrollment_year, is_active)
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING *
    ) SELECT ${fields} FROM saved s JOIN student_dashboard.majors m ON m.id = s.major_id`, values)
    const student = result.rows[0]
    res.location(`/api/dashboard/students/${student.id}`).status(201).json({ student })
  })
  router.put('/students/:id', async (req, res) => {
    const values = validateStudent(req.body)
    if (!values) return invalidBody(res)
    const result = await database.query(`WITH saved AS (
      UPDATE student_dashboard.students SET first_name = $1, last_name = $2,
        email = $3, major_id = $4, enrollment_year = $5, is_active = $6,
        updated_at = clock_timestamp()
      WHERE id = $7 RETURNING *
    ) SELECT ${fields} FROM saved s JOIN student_dashboard.majors m ON m.id = s.major_id`,
    [...values, Number(req.params.id)])
    if (!result.rowCount) return notFound(res, req.params.id)
    res.json({ student: result.rows[0] })
  })
  router.delete('/students/:id', async (req, res) => {
    const result = await database.query('DELETE FROM student_dashboard.students WHERE id = $1 RETURNING id', [Number(req.params.id)])
    if (!result.rowCount) return notFound(res, req.params.id)
    res.json({ deletedId: result.rows[0].id })
  })
  router.use(dashboardErrorHandler)
  return router
}

function notFound(res, id) {
  return res.status(404).json({ error: 'STUDENT_NOT_FOUND', message: `Student ${id} was not found.` })
}
function invalidBody(res) {
  return res.status(400).json({ error: 'INVALID_STUDENT', message: 'Provide firstName, lastName, email, integer majorId, enrollmentYear (1900–2100), and boolean isActive.' })
}
export function dashboardErrorHandler(error, _req, res, _next) {
  if (error.type === 'entity.parse.failed') return res.status(400).json({ error: 'INVALID_JSON', message: 'Send a valid JSON body.' })
  if (error.type === 'entity.too.large') return res.status(413).json({ error: 'BODY_TOO_LARGE', message: 'Request body is too large.' })
  if (error.code === '23505') return res.status(409).json({ error: 'DUPLICATE_EMAIL', message: 'That email is already saved.' })
  if (['23503', '23514', '23502', '22001'].includes(error.code)) return res.status(400).json({ error: 'INVALID_STUDENT', message: 'Student values violate a database constraint. Select an existing major.' })
  const unavailable = ['ECONNREFUSED', 'ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', '57P01', '53300'].includes(error.code)
    || error.code?.startsWith('08') || /timeout|connection terminated/i.test(error.message)
  console.error('Dashboard database request failed:', error.code || error.message)
  return res.status(unavailable ? 503 : 500).json({
    error: unavailable ? 'DATABASE_UNAVAILABLE' : 'DATABASE_ERROR',
    message: unavailable ? 'Database unavailable. The operation could not be confirmed. Retrieve the record before retrying.' : 'The database operation failed.',
  })
}
