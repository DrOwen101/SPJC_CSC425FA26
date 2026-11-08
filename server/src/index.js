import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { app } from './app.js'
import { pool } from './db.js'

const port = Number(process.env.PORT) || 3000
const host = process.env.HOST || '0.0.0.0'

// Enable CORS and JSON body parsing for browser requests
app.use(cors())
app.use(express.json())

// -------------------------------------------------------------
// API Endpoints
// -------------------------------------------------------------

// GET /api/health - Test database connectivity directly in browser
app.get('/api/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()')
    res.json({ status: 'connected', dbTime: result.rows[0].now })
  } catch (error) {
    console.error('❌ Health check error:', error.message)
    res.status(500).json({ status: 'error', message: error.message })
  }
})

// GET /api/enrollments - Returns all enrollment records as JSON
app.get('/api/enrollments', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT student_id AS "studentId", class_id AS "classId", status FROM enrollment ORDER BY student_id ASC'
    )
    res.json(result.rows)
  } catch (error) {
    console.error('❌ Error fetching enrollments:', error.message)
    res.status(500).json({ message: 'Failed to retrieve enrollment records.' })
  }
})

// POST /api/enrollments - Add a new enrollment record
app.post('/api/enrollments', async (req, res) => {
  const { studentId, classId, status = 'enrolled' } = req.body

  if (!studentId || !classId) {
    return res.status(400).json({ message: 'Both studentId and classId are required.' })
  }

  try {
    const query = `
      INSERT INTO enrollment (student_id, class_id, status)
      VALUES ($1, $2, $3)
      RETURNING student_id AS "studentId", class_id AS "classId", status;
    `
    const values = [parseInt(studentId, 10), parseInt(classId, 10), status]
    const result = await pool.query(query, values)

    res.status(201).json(result.rows[0])
  } catch (error) {
    console.error('❌ Error adding enrollment:', error.message)
    if (error.code === '23505') {
      return res.status(409).json({ message: 'Student is already enrolled in this class.' })
    }
    if (error.code === '23503') {
      return res.status(404).json({ message: 'Student ID or Class ID does not exist.' })
    }
    res.status(500).json({ message: 'Failed to add enrollment record.' })
  }
})

// DELETE /api/enrollments - Delete an enrollment record
app.delete('/api/enrollments', async (req, res) => {
  const { studentId, classId } = req.body

  if (!studentId || !classId) {
    return res.status(400).json({ message: 'Both studentId and classId are required.' })
  }

  try {
    const query = `
      DELETE FROM enrollment
      WHERE student_id = $1 AND class_id = $2
      RETURNING student_id AS "studentId", class_id AS "classId";
    `
    const values = [parseInt(studentId, 10), parseInt(classId, 10)]
    const result = await pool.query(query, values)

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Enrollment record not found.' })
    }

    res.json({ message: 'Enrollment deleted successfully.' })
  } catch (error) {
    console.error('❌ Error deleting enrollment:', error.message)
    res.status(500).json({ message: 'Failed to delete enrollment record.' })
  }
})

// -------------------------------------------------------------
// Startup Helpers
// -------------------------------------------------------------



// -------------------------------------------------------------
// Server Initialization
// -------------------------------------------------------------

app.listen(port, host, () => {
  console.log(`CSC 425 API listening on http://localhost:${port}`)
  console.log(`Health Check: http://localhost:${port}/api/health`)
  console.log(`Enrollment data: http://localhost:${port}/api/enrollments`)
})