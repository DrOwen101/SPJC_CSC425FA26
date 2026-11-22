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

// Enforce faculty-only permissions on the backend
function requireFaculty(req, res, next) {
  const role = req.user?.role || req.headers['x-user-role']
  if (role !== 'faculty') {
    return res.status(403).json({
      error: 'FORBIDDEN',
      message: 'Faculty permissions are required to perform this action.',
    })
  }
  next()
}

// Deliverable 1 (Repurposed Enrollment): Update student enrollment status
app.patch('/api/enrollments', requireFaculty, async (req, res) => {
  const { studentId, classId, status } = req.body
  if (!studentId || !classId || !status) {
    return res.status(400).json({ message: 'studentId, classId, and status are required.' })
  }

  try {
    const result = await pool.query(
      `UPDATE enrollment SET status = $1
       WHERE student_id = $2 AND class_id = $3
       RETURNING student_id AS "studentId", class_id AS "classId", status;`,
      [status, parseInt(studentId, 10), parseInt(classId, 10)]
    )
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Enrollment record not found.' })
    }
    res.json(result.rows[0])
  } catch (error) {
    res.status(500).json({ message: 'Failed to update enrollment status.' })
  }
})

// Deliverable 2 (Repurposed Transcript): Advisor Notes
app.get('/api/advising-notes/:studentId', requireFaculty, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT note_id AS "noteId", advisor_name AS "advisorName", note_text AS "noteText", created_at AS "createdAt" FROM advising_notes WHERE student_id = $1 ORDER BY created_at DESC',
      [req.params.studentId]
    )
    res.json(result.rows)
  } catch (error) {
    res.status(500).json({ message: 'Failed to load advising notes.' })
  }
})

app.post('/api/advising-notes', requireFaculty, async (req, res) => {
  const { studentId, advisorName = 'Faculty Advisor', noteText } = req.body
  if (!studentId || !noteText?.trim()) {
    return res.status(400).json({ message: 'Student ID and note text are required.' })
  }

  try {
    const result = await pool.query(
      `INSERT INTO advising_notes (student_id, advisor_name, note_text)
       VALUES ($1, $2, $3)
       RETURNING note_id AS "noteId", advisor_name AS "advisorName", note_text AS "noteText", created_at AS "createdAt";`,
      [studentId, advisorName, noteText.trim()]
    )
    res.status(201).json(result.rows[0])
  } catch (error) {
    res.status(500).json({ message: 'Failed to save advising note.' })
  }
})

// Deliverable 3 (New Faculty Feature - Design): Grade Entry
app.get('/api/faculty/grades', requireFaculty, async (_req, res) => {
  try {
    const result = await pool.query(
      'SELECT grade_id AS "gradeId", student_id AS "studentId", class_id AS "classId", letter_grade AS "letterGrade", feedback FROM faculty_grades ORDER BY submitted_at DESC'
    )
    res.json(result.rows)
  } catch (error) {
    res.status(500).json({ message: 'Failed to load submitted grades.' })
  }
})

app.post('/api/faculty/grades', requireFaculty, async (req, res) => {
  const { studentId, classId, letterGrade, feedback = '' } = req.body
  if (!studentId || !classId || !letterGrade) {
    return res.status(400).json({ message: 'Student ID, Class ID, and Letter Grade are required.' })
  }

  try {
    const result = await pool.query(
      `INSERT INTO faculty_grades (student_id, class_id, letter_grade, feedback)
       VALUES ($1, $2, $3, $4)
       RETURNING grade_id AS "gradeId", student_id AS "studentId", class_id AS "classId", letter_grade AS "letterGrade", feedback;`,
      [studentId.trim(), classId.trim(), letterGrade.trim().toUpperCase(), feedback.trim()]
    )
    res.status(201).json(result.rows[0])
  } catch (error) {
    res.status(500).json({ message: 'Failed to submit grade.' })
  }
})

// Deliverable 4 (New Faculty Feature - Design): Teaching Schedule & Office Hours
app.get('/api/faculty/schedule', async (_req, res) => {
  try {
    const result = await pool.query(
      'SELECT schedule_id AS "scheduleId", course_code AS "courseCode", entry_type AS "entryType", day_time AS "dayTime", location FROM teaching_schedule ORDER BY schedule_id ASC'
    )
    res.json(result.rows)
  } catch (error) {
    res.status(500).json({ message: 'Failed to load teaching schedule.' })
  }
})

app.post('/api/faculty/schedule', requireFaculty, async (req, res) => {
  const { courseCode, entryType, dayTime, location } = req.body
  if (!courseCode || !entryType || !dayTime || !location) {
    return res.status(400).json({ message: 'All schedule fields are required.' })
  }

  try {
    const result = await pool.query(
      `INSERT INTO teaching_schedule (course_code, entry_type, day_time, location)
       VALUES ($1, $2, $3, $4)
       RETURNING schedule_id AS "scheduleId", course_code AS "courseCode", entry_type AS "entryType", day_time AS "dayTime", location;`,
      [courseCode.trim(), entryType, dayTime.trim(), location.trim()]
    )
    res.status(201).json(result.rows[0])
  } catch (error) {
    res.status(500).json({ message: 'Failed to add schedule entry.' })
  }
})

app.delete('/api/faculty/schedule/:id', requireFaculty, async (req, res) => {
  try {
    await pool.query('DELETE FROM teaching_schedule WHERE schedule_id = $1', [req.params.id])
    res.json({ message: 'Schedule item removed.' })
  } catch (error) {
    res.status(500).json({ message: 'Failed to remove schedule item.' })
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