import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import { checkDatabase, pool } from './db.js'

export const app = express()

const api = express.Router()
const gradePoints = {
  'A+': 4,
  A: 4,
  'A-': 3.7,
  'B+': 3.3,
  B: 3,
  'B-': 2.7,
  'C+': 2.3,
  C: 2,
  'C-': 1.7,
  'D+': 1.3,
  D: 1,
  'D-': 0.7,
  F: 0,
}

app.use(express.json())
app.use('/api', cors({ origin: '*', methods: ['GET', 'POST', 'DELETE', 'HEAD', 'OPTIONS'] }), api)

app.get('/', (_request, response) => {
  response.json({
    message: 'CSC 425 API',
    description: 'Fictional student and academic data stored in PostgreSQL.',
    endpoints: {
      students: '/api/students',
      transcript: '/api/transcripts/1001',
      transcriptQuery: '/api/transcripts?studentID=1001',
      status: '/api/status',
      databaseHealth: '/api/health',
      attendance: '/api/attendance',
    },
  })
})

api.get('/status', async (_request, response) => {
  const result = await pool.query('SELECT count(*)::integer AS student_count FROM students')
  response.json({
    status: 'ok',
    service: 'PostgreSQL student API',
    studentCount: result.rows[0].student_count,
  })
})

api.get('/students', async (_request, response) => {
  const result = await pool.query(`
    SELECT student_id, first_name, last_name, major
    FROM students
    ORDER BY student_id
  `)

  response.json({
    students: result.rows.map((student) => ({
      studentID: String(student.student_id),
      firstName: student.first_name,
      lastName: student.last_name,
      major: student.major,
    })),
  })
})

async function getTranscript(request, response) {
  const studentID = request.params.studentID ?? request.query.studentID
  if (typeof studentID !== 'string' || !/^\d{4}$/.test(studentID)) {
    return response.status(400).json({
      error: 'INVALID_STUDENT_ID',
      message: 'Provide a four-digit studentID, for example /api/transcripts/1001.',
    })
  }

  const studentResult = await pool.query(`
    SELECT student_id, first_name, last_name, major, institution
    FROM students
    WHERE student_id = $1
  `, [Number(studentID)])
  if (studentResult.rowCount === 0) {
    return response.status(404).json({
      error: 'STUDENT_NOT_FOUND',
      message: `No student was found with studentID ${studentID}.`,
    })
  }

  const courseResult = await pool.query(`
    SELECT t.term_name, t.sort_order, c.course_code, c.course_title,
           c.credit_hours, e.grade
    FROM enrollments e
    JOIN terms t ON t.term_id = e.term_id
    JOIN courses c ON c.course_code = e.course_code
    WHERE e.student_id = $1
    ORDER BY t.sort_order, c.course_code
  `, [Number(studentID)])

  const student = studentResult.rows[0]
  const semesters = []
  for (const row of courseResult.rows) {
    let semester = semesters.at(-1)
    if (!semester || semester.term !== row.term_name) {
      semester = {
        term: row.term_name,
        courses: [],
        creditsAttempted: 0,
        creditsEarned: 0,
        qualityPoints: 0,
      }
      semesters.push(semester)
    }

    semester.courses.push({
      courseCode: row.course_code,
      courseTitle: row.course_title,
      creditHours: row.credit_hours,
      grade: row.grade,
    })
    semester.creditsAttempted += row.credit_hours
    if (row.grade !== 'F') semester.creditsEarned += row.credit_hours
    semester.qualityPoints += row.credit_hours * gradePoints[row.grade]
  }

  let creditsAttempted = 0
  let creditsEarned = 0
  let qualityPoints = 0
  for (const semester of semesters) {
    creditsAttempted += semester.creditsAttempted
    creditsEarned += semester.creditsEarned
    qualityPoints += semester.qualityPoints
    semester.gpa = Number((semester.qualityPoints / semester.creditsAttempted).toFixed(2))
    delete semester.qualityPoints
  }

  response.json({
    studentID: String(student.student_id),
    firstName: student.first_name,
    lastName: student.last_name,
    major: student.major,
    institution: student.institution,
    semesters,
    summary: {
      creditsAttempted,
      creditsEarned,
      cumulativeGPA: creditsAttempted ? Number((qualityPoints / creditsAttempted).toFixed(2)) : 0,
    },
  })
}

api.get('/transcripts', getTranscript)
api.get('/transcripts/:studentID', getTranscript)

api.get('/attendance', async (_request, response) => {
  const result = await pool.query(`
    SELECT a.id, s.first_name, s.last_name,
           to_char(a.attendance_date, 'YYYY-MM-DD') AS attendance_date, a.status
    FROM attendance_records a
    JOIN students s ON s.student_id = a.student_id
    ORDER BY a.attendance_date, a.id
  `)

  response.json(result.rows.map((record) => ({
    id: record.id,
    student: `${record.first_name} ${record.last_name}`,
    date: record.attendance_date,
    status: record.status,
  })))
})

api.post('/attendance', async (request, response) => {
  const { studentID, date, status } = request.body ?? {}
  if (
    typeof studentID !== 'string'
    || !/^\d{4}$/.test(studentID)
    || typeof date !== 'string'
    || !/^\d{4}-\d{2}-\d{2}$/.test(date)
    || Number.isNaN(Date.parse(`${date}T00:00:00Z`))
    || new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) !== date
    || !['present', 'absent', 'late'].includes(status)
  ) {
    return response.status(400).json({
      error: 'INVALID_ATTENDANCE',
      message: 'Provide a four-digit studentID, a valid YYYY-MM-DD date, and status present, absent, or late.',
    })
  }

  const studentResult = await pool.query(`
    SELECT student_id, first_name, last_name
    FROM students
    WHERE student_id = $1
  `, [Number(studentID)])
  if (studentResult.rowCount === 0) {
    return response.status(404).json({
      error: 'STUDENT_NOT_FOUND',
      message: `No student was found with studentID ${studentID}.`,
    })
  }

  const result = await pool.query(`
    INSERT INTO attendance_records (student_id, attendance_date, status)
    VALUES ($1, $2, $3)
    ON CONFLICT (student_id, attendance_date) DO NOTHING
    RETURNING id, student_id, to_char(attendance_date, 'YYYY-MM-DD') AS attendance_date, status
  `, [Number(studentID), date, status])
  if (result.rowCount === 0) {
    return response.status(409).json({
      error: 'ATTENDANCE_ALREADY_EXISTS',
      message: `An attendance record already exists for student ${studentID} on ${date}.`,
    })
  }

  const record = result.rows[0]
  const student = studentResult.rows[0]
  console.info('Attendance record created', {
    id: record.id,
    studentID: String(record.student_id),
    date: record.attendance_date,
  })
  response.status(201).json({
    id: record.id,
    studentID: String(record.student_id),
    student: `${student.first_name} ${student.last_name}`,
    date: record.attendance_date,
    status: record.status,
  })
})

api.get('/attendance/:id', async (request, response) => {
  if (!/^[1-9]\d*$/.test(request.params.id)) {
    return response.status(400).json({ error: 'INVALID_ATTENDANCE_ID' })
  }

  const result = await pool.query(`
    SELECT a.id, s.first_name, s.last_name,
           to_char(a.attendance_date, 'YYYY-MM-DD') AS attendance_date, a.status
    FROM attendance_records a
    JOIN students s ON s.student_id = a.student_id
    WHERE a.id = $1
  `, [Number(request.params.id)])
  if (result.rowCount === 0) {
    return response.status(404).json({ error: 'ATTENDANCE_NOT_FOUND' })
  }

  const record = result.rows[0]
  response.json({
    id: record.id,
    student: `${record.first_name} ${record.last_name}`,
    date: record.attendance_date,
    status: record.status,
  })
})

api.delete('/attendance/:id', async (request, response) => {
  if (!/^[1-9]\d*$/.test(request.params.id)) {
    return response.status(400).json({ error: 'INVALID_ATTENDANCE_ID' })
  }

  const result = await pool.query(`
    DELETE FROM attendance_records a
    USING students s
    WHERE a.id = $1 AND s.student_id = a.student_id
    RETURNING a.id, a.student_id, s.first_name, s.last_name,
              to_char(a.attendance_date, 'YYYY-MM-DD') AS attendance_date, a.status
  `, [Number(request.params.id)])
  if (result.rowCount === 0) {
    return response.status(404).json({
      error: 'ATTENDANCE_NOT_FOUND',
      message: `No attendance record was found with ID ${request.params.id}.`,
    })
  }

  const record = result.rows[0]
  console.info('Attendance record deleted', { id: record.id })
  response.json({
    id: record.id,
    studentID: String(record.student_id),
    student: `${record.first_name} ${record.last_name}`,
    date: record.attendance_date,
    status: record.status,
    deleted: true,
  })
})

api.get('/health', async (_request, response) => {
  try {
    const database = await checkDatabase()
    response.json({ status: 'ok', database: 'connected', timestamp: database.current_time })
  } catch (error) {
    console.error('Database health check failed:', error.message)
    response.status(503).json({
      status: 'error',
      database: 'disconnected',
      message: 'PostgreSQL is unavailable.',
    })
  }
})

app.use((error, _request, response, _next) => {
  console.error('API request failed:', error)
  if (response.headersSent) return
  response.status(500).json({
    error: 'INTERNAL_SERVER_ERROR',
    message: 'The request could not be completed.',
  })
})
