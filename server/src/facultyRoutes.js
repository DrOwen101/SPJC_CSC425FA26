import { createHash, timingSafeEqual } from 'node:crypto'
import express from 'express'
import { pool } from './db.js'

export const facultyRouter = express.Router()

const facultyUsername = 'faculty'

function hash(value) {
  return createHash('sha256').update(value).digest()
}

facultyRouter.use((req, res, next) => {
  res.set('Cache-Control', 'no-store')

  const password = process.env.LAB12_FACULTY_PASSWORD
  if (!password) {
    return res.status(503).json({ error: 'Faculty sign-in is not configured.' })
  }

  const authorization = req.get('authorization')
  if (!authorization) {
    return res.status(401).json({ error: 'Faculty sign-in is required.' })
  }

  const credential = authorization.match(/^Basic ([A-Za-z0-9+/]+={0,2})$/i)
  if (!credential || !timingSafeEqual(
    hash(Buffer.from(credential[1], 'base64')),
    hash(`${facultyUsername}:${password}`)
  )) {
    return res.status(403).json({ error: 'Only the faculty demo account can access this feature.' })
  }

  res.locals.facultyUsername = facultyUsername
  next()
})

facultyRouter.get('/schedule', async (_req, res) => {
  const { rows } = await pool.query(`
    SELECT code, title, meeting_time AS "meetingTime", room
    FROM lab12.courses
    WHERE faculty_username = $1
    ORDER BY code
  `, [res.locals.facultyUsername])
  res.json(rows)
})

const courseRouter = express.Router({ mergeParams: true })

courseRouter.use(async (req, res, next) => {
  const { rowCount } = await pool.query(`
    SELECT 1 FROM lab12.courses WHERE code = $1 AND faculty_username = $2
  `, [req.params.code, res.locals.facultyUsername])

  if (!rowCount) return res.status(404).json({ error: 'Assigned course not found.' })
  next()
})

courseRouter.get('/roster', async (req, res) => {
  const { rows } = await pool.query(`
    SELECT s.student_id AS "studentID", s.first_name AS "firstName", s.last_name AS "lastName", s.major
    FROM lab12.enrollments e
    JOIN lab10.students s USING (student_id)
    JOIN lab12.courses c ON c.code = e.course_code
    WHERE e.course_code = $1 AND c.faculty_username = $2
    ORDER BY s.last_name, s.first_name, s.student_id
  `, [req.params.code, res.locals.facultyUsername])
  res.json({ students: rows })
})

courseRouter.get('/attendance', async (req, res) => {
  const { rows } = await pool.query(`
    SELECT a.id, a.student_id AS "studentId", s.first_name || ' ' || s.last_name AS "studentName",
           TO_CHAR(a.attendance_date, 'YYYY-MM-DD') AS date, a.status
    FROM lab12.class_attendance a
    JOIN lab10.students s USING (student_id)
    JOIN lab12.courses c ON c.code = a.course_code
    WHERE a.course_code = $1 AND c.faculty_username = $2
    ORDER BY a.attendance_date DESC, s.last_name, s.first_name, a.id
  `, [req.params.code, res.locals.facultyUsername])
  res.json(rows)
})

facultyRouter.use('/courses/:code', courseRouter)

facultyRouter.get('/grading', async (_req, res) => {
  const { rows } = await pool.query(`
    SELECT t.id, t.course_code AS "courseCode", t.assignment,
           s.first_name || ' ' || s.last_name AS "studentName", t.reviewed_at AS "reviewedAt"
    FROM lab12.grading_tasks t
    JOIN lab12.courses c ON c.code = t.course_code
    JOIN lab10.students s ON s.student_id = t.student_id
    WHERE c.faculty_username = $1
    ORDER BY t.reviewed_at NULLS FIRST, t.id
  `, [res.locals.facultyUsername])
  res.json(rows)
})

facultyRouter.put('/grading/:id/review', async (req, res) => {
  const id = Number(req.params.id)
  if (!/^[1-9]\d*$/.test(req.params.id) || !Number.isInteger(id) || id > 2147483647) {
    return res.status(400).json({ error: 'Provide a valid grading task ID.' })
  }

  const { rows } = await pool.query(`
    UPDATE lab12.grading_tasks t
    SET reviewed_at = COALESCE(t.reviewed_at, CURRENT_TIMESTAMP)
    FROM lab12.courses c
    WHERE t.id = $1 AND c.code = t.course_code AND c.faculty_username = $2
    RETURNING t.reviewed_at AS "reviewedAt"
  `, [id, res.locals.facultyUsername])

  if (!rows.length) return res.status(404).json({ error: 'Assigned grading task not found.' })
  res.json(rows[0])
})

facultyRouter.use((error, _req, res, _next) => {
  console.error('Faculty API failed:', error)
  res.status(500).json({ error: 'Faculty records are currently unavailable.' })
})
