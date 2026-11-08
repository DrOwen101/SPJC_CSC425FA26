import express from 'express'
import { pool } from './db.js'

export const attendanceRouter = express.Router()

const selectAttendance = `
  SELECT
    a.id,
    a.student_id AS "studentId",
    s.first_name || ' ' || s.last_name AS "studentName",
    TO_CHAR(a.attendance_date, 'YYYY-MM-DD') AS date,
    a.status
  FROM lab10.attendance AS a
  JOIN lab10.students AS s
    ON s.student_id = a.student_id
`

function validId(value) {
  return /^[1-9]\d*$/.test(value) &&
    Number.isSafeInteger(Number(value)) &&
    Number(value) <= 2147483647
}

function validRecord(body) {
  const { studentId, date, status } = body ?? {}

  if (
    typeof studentId !== 'string' ||
    !/^\d{4}$/.test(studentId)
  ) {
    return false
  }

  if (
    typeof date !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(date)
  ) {
    return false
  }

  const parsedDate = new Date(`${date}T00:00:00Z`)

  if (
    Number.isNaN(parsedDate.getTime()) ||
    parsedDate.toISOString().slice(0, 10) !== date
  ) {
    return false
  }

  return ['present', 'absent', 'late'].includes(status)
}

// Validate record IDs before retrieving, editing, or deleting.
attendanceRouter.param('id', (req, res, next, id) => {
  if (!validId(id)) {
    return res.status(400).json({
      error: 'Provide a valid positive attendance ID',
    })
  }

  next()
})

// Retrieve all saved attendance records.
attendanceRouter.get('/', async (req, res, next) => {
  try {
    const result = await pool.query(
      `${selectAttendance} ORDER BY a.id`
    )
    res.json(result.rows)
  } catch (error) {
    next(error)
  }
})

// Retrieve one saved record.
attendanceRouter.get('/:id', async (req, res, next) => {
  try {
    const result = await pool.query(
      `${selectAttendance} WHERE a.id = $1`,
      [req.params.id]
    )

    if (result.rowCount === 0) {
      return res.status(404).json({
        error: 'Attendance record not found',
      })
    }

    res.json(result.rows[0])
  } catch (error) {
    next(error)
  }
})

// Create a record in PostgreSQL.
attendanceRouter.post('/', async (req, res, next) => {
  if (!validRecord(req.body)) {
    return res.status(400).json({
      error: 'Provide a four-digit studentId, valid date, and valid status',
    })
  }

  const { studentId, date, status } = req.body

  try {
    const result = await pool.query(
      `INSERT INTO lab10.attendance
         (student_id, attendance_date, status)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [studentId, date, status]
    )

    res.status(201).json({
      id: result.rows[0].id,
      message: 'Attendance saved',
    })
  } catch (error) {
    next(error)
  }
})

// Edit and resave exactly one record.
attendanceRouter.put('/:id', async (req, res, next) => {
  if (!validRecord(req.body)) {
    return res.status(400).json({
      error: 'Provide a four-digit studentId, valid date, and valid status',
    })
  }

  const { studentId, date, status } = req.body

  try {
    const result = await pool.query(
      `UPDATE lab10.attendance
       SET student_id = $1,
           attendance_date = $2,
           status = $3
       WHERE id = $4
       RETURNING id`,
      [studentId, date, status, req.params.id]
    )

    if (result.rowCount === 0) {
      return res.status(404).json({
        error: 'Attendance record not found',
      })
    }

    res.json({
      id: result.rows[0].id,
      message: 'Attendance updated',
    })
  } catch (error) {
    next(error)
  }
})

// Delete exactly one record.
attendanceRouter.delete('/:id', async (req, res, next) => {
  try {
    const result = await pool.query(
      `DELETE FROM lab10.attendance
       WHERE id = $1
       RETURNING id`,
      [req.params.id]
    )

    if (result.rowCount === 0) {
      return res.status(404).json({
        error: 'Attendance record not found',
      })
    }

    res.json({
      id: result.rows[0].id,
      message: 'Attendance deleted',
    })
  } catch (error) {
    next(error)
  }
})

// Failed database operations must not return a success response.
attendanceRouter.use((error, req, res, next) => {
  console.error('Attendance database error:', error)

  if (error.code === '23505') {
    return res.status(409).json({
      error: 'Attendance already exists for this student and date',
    })
  }

  if (error.code === '23503') {
    return res.status(400).json({
      error: 'Student ID does not exist in the database',
    })
  }

  if (
    ['ECONNREFUSED', 'ETIMEDOUT', '53300', '57P03']
      .includes(error.code) ||
    error.code?.startsWith('08')
  ) {
    return res.status(503).json({
      error: 'Database unavailable. Please try again',
    })
  }

  res.status(500).json({
    error: 'Database operation failed',
  })
})