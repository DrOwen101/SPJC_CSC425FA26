import 'dotenv/config'
import { readFileSync } from 'node:fs'
import cors from 'cors'
import express from 'express'
import { checkDatabase, pool } from './db.js'

export const app =  express()

const attendance = [
  { id: 1, studentId: "1001", studentName: "Avery Morgan",
    date: "2026-10-20", status: "present" },
  { id: 2, studentId: "1002", studentName: "Jordan Bennett",
    date: "2026-10-20", status: "absent" },
  { id: 3, studentId: "1003", studentName: "Taylor Reed",
    date: "2026-10-20", status: "late" }
];

app.get("/api/attendance", (req, res) => {
  res.status(200).json(attendance);
});

app.get("/api/attendance/:id", (req, res) => {
  const attendanceId = Number(req.params.id);
  const record = attendance.find((item) => {
    return item.id === attendanceId;
  });
  if (!record) {
    return res.status(404).json({ error: "Attendance record not found" });
  }
  res.status(200).json(record);
});
// Hard-coded data for the Student Lookup exercise. These are fictional people.
// Students can edit this array to test their frontend without a database,
// SQL queries, credentials, or a .env file. Keep student IDs as strings.
const mockStudents = [
  {
    studentID: '1001',
    firstName: 'Avery',
    lastName: 'Morgan',
    major: 'Computer Science',
  },
  {
    studentID: '1002',
    firstName: 'Jordan',
    lastName: 'Bennett',
    major: 'Information Systems',
  },
  {
    studentID: '1003',
    firstName: 'Taylor',
    lastName: 'Reed',
    major: 'Business Administration',
  },
  {
    studentID: '1004',
    firstName: 'Cameron',
    lastName: 'Brooks',
    major: 'Mathematics',
  },
  {
    studentID: '1005',
    firstName: 'Riley',
    lastName: 'Parker',
    major: 'Computer Science',
  },
]

// The earlier transcript exercise keeps its course/grade fixtures in JSON.
// It also works without a database. /api/students uses only the array above.
const { students: transcripts } = JSON.parse(readFileSync(new URL('./data/transcripts.json', import.meta.url), 'utf8'))

// Only the fictional API allows requests from any frontend origin.
const teachingApi = express.Router()
teachingApi.use(['/status', '/students', '/transcripts'], cors({ methods: ['GET', 'HEAD', 'OPTIONS'] }))

teachingApi.get('/status', (_request, response) => {
  response.json({ status: 'ok', service: 'Mock transcript API', studentCount: mockStudents.length })
})

teachingApi.get('/students', (_request, response) => {
  // Express converts the JavaScript object to JSON for the React frontend.
  // StudentLookup selects the matching full name from this returned array.
  response.json({ students: mockStudents })
})

// Support both a path parameter and a query parameter for classroom examples.
function getTranscript(request, response) {
  const studentID = request.params.studentID ?? request.query.studentID

  if (typeof studentID !== 'string' || !/^\d{4}$/.test(studentID)) {
    return response.status(400).json({
      error: 'INVALID_STUDENT_ID',
      message: 'Provide a four-digit studentID, for example /api/transcripts/1001.',
    })
  }

  const student = transcripts.find((student) => student.studentID === studentID)
  if (!student) {
    return response.status(404).json({
      error: 'STUDENT_NOT_FOUND',
      message: `No mock student was found with studentID ${studentID}.`,
    })
  }

  return response.json(student)
}

teachingApi.get('/transcripts', getTranscript)
teachingApi.get('/transcripts/:studentID', getTranscript)

// These handlers finish before the original starter API's CORS middleware.
app.use('/api', teachingApi)

app.use(cors({ origin: 'http://localhost:5173' }))
app.use(express.json())

app.get('/', (_request, response) => {
  response.json({
    message: 'CSC 425 API',
    description: 'Fictional student transcripts for frontend practice. No API key required.',
    endpoints: {
      students: '/api/students',
      transcript: '/api/transcripts/1001',
      transcriptQuery: '/api/transcripts?studentID=1001',
      status: '/api/status',
      databaseHealth: '/api/health',
    },
  })
})

app.get('/api/health', async (_request, response) => {
  try {
    const database = await checkDatabase()
    response.json({ status: 'ok', database: 'connected', timestamp: database.current_time })
  } catch (error) {
    console.error('Database health check failed:', error.message)
    response.status(503).json({ status: 'error', database: 'disconnected', message: error.message })
  }
})

app.get('/api/student-records', async (request, response) => {
  const { studentID } = request.query

  if (studentID !== undefined && (typeof studentID !== 'string' || !/^\d{4}$/.test(studentID))) {
    return response.status(400).json({
      error: 'INVALID_STUDENT_ID',
      message: 'studentID must be a four-digit ID, for example 9101.',
    })
  }

  try {
    const result = await pool.query(
      `SELECT
        r.record_id AS "recordId",
        s.student_id AS "studentID",
        s.first_name AS "firstName",
        s.last_name AS "lastName",
        r.term,
        r.course_code AS "courseCode",
        r.grade,
        r.credit_hours AS "creditHours"
      FROM academic_records AS r
      JOIN students AS s ON s.student_id = r.student_id
      WHERE ($1::varchar IS NULL OR s.student_id = $1)
      ORDER BY s.student_id, r.record_id`,
      [studentID ?? null],
    )

    return response.status(200).json({ records: result.rows })
  } catch (error) {
    console.error('Student records query failed:', error.message)
    return response.status(500).json({
      error: 'DATABASE_QUERY_FAILED',
      message: 'Unable to load student records.',
    })
  }
})

const validGrades = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'F']

function isValidCourseRecord({ term, courseCode, grade, creditHours }) {
  return typeof term === 'string'
    && term.trim().length > 0
    && term.trim().length <= 20
    && typeof courseCode === 'string'
    && courseCode.trim().length > 0
    && courseCode.trim().length <= 12
    && validGrades.includes(grade)
    && Number.isInteger(creditHours)
    && creditHours >= 1
    && creditHours <= 6
}

app.post('/api/student-records', async (request, response) => {
  const { studentID, term, courseCode, grade, creditHours } = request.body ?? {}

  if (
    typeof studentID !== 'string'
    || !/^\d{4}$/.test(studentID)
    || !isValidCourseRecord({ term, courseCode, grade, creditHours })
  ) {
    return response.status(400).json({
      error: 'INVALID_RECORD',
      message: 'Provide a four-digit studentID, a term (up to 20 characters), a courseCode (up to 12 characters), a valid letter grade, and creditHours from 1 to 6.',
    })
  }

  try {
    const insertResult = await pool.query(
      `INSERT INTO academic_records (student_id, term, course_code, grade, credit_hours)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING record_id`,
      [studentID, term.trim(), courseCode.trim(), grade, creditHours],
    )

    const record = await pool.query(
      `SELECT
        r.record_id AS "recordId",
        s.student_id AS "studentID",
        s.first_name AS "firstName",
        s.last_name AS "lastName",
        r.term,
        r.course_code AS "courseCode",
        r.grade,
        r.credit_hours AS "creditHours"
       FROM academic_records AS r
       JOIN students AS s ON s.student_id = r.student_id
       WHERE r.record_id = $1`,
      [insertResult.rows[0].record_id],
    )

    return response.status(201).json({ record: record.rows[0] })
  } catch (error) {
    if (error.code === '23503') {
      return response.status(404).json({
        error: 'STUDENT_NOT_FOUND',
        message: `No student exists with studentID ${studentID}.`,
      })
    }
    if (error.code === '23505') {
      return response.status(409).json({
        error: 'DUPLICATE_RECORD',
        message: 'That student already has a record for this course and term.',
      })
    }

    console.error('Student record creation failed:', error.message)
    return response.status(500).json({
      error: 'DATABASE_QUERY_FAILED',
      message: 'Unable to create the student record.',
    })
  }
})

app.put('/api/student-records/:id', async (request, response) => {
  const recordId = request.params.id
  const { term, courseCode, grade, creditHours } = request.body ?? {}

  if (!isValidCourseRecord({ term, courseCode, grade, creditHours })) {
    return response.status(400).json({
      error: 'INVALID_RECORD',
      message: 'Provide a valid record ID, term, course code, letter grade, and credit hours from 1 to 6.',
    })
  }

  try {
    const updateResult = await pool.query(
      `UPDATE academic_records
       SET term = $1, course_code = $2, grade = $3, credit_hours = $4
       WHERE record_id = $5
       RETURNING record_id`,
      [term.trim(), courseCode.trim(), grade, creditHours, recordId],
    )

    if (updateResult.rowCount === 0) {
      return response.status(404).json({
        error: 'RECORD_NOT_FOUND',
        message: `No course record exists with record ID ${recordId}.`,
      })
    }

    const record = await pool.query(
      `SELECT
        r.record_id AS "recordId",
        s.student_id AS "studentID",
        s.first_name AS "firstName",
        s.last_name AS "lastName",
        r.term,
        r.course_code AS "courseCode",
        r.grade,
        r.credit_hours AS "creditHours"
       FROM academic_records AS r
       JOIN students AS s ON s.student_id = r.student_id
       WHERE r.record_id = $1`,
      [recordId],
    )

    return response.status(200).json({ record: record.rows[0] })
  } catch (error) {
    if (error.code === '23505') {
      return response.status(409).json({
        error: 'DUPLICATE_RECORD',
        message: 'That student already has a record for this course and term.',
      })
    }

    console.error('Student record update failed:', error.message)
    return response.status(500).json({
      error: 'DATABASE_QUERY_FAILED',
      message: 'Unable to update the student record.',
    })
  }
})

app.delete('/api/student-records/:id', async (request, response) => {
  const recordId = request.params.id

  try {
    const result = await pool.query(
      'DELETE FROM academic_records WHERE record_id = $1',
      [recordId],
    )

    if (result.rowCount === 0) {
      return response.status(404).json({
        error: 'RECORD_NOT_FOUND',
        message: `No course record exists with record ID ${recordId}.`,
      })
    }

    return response.status(204).end()
  } catch (error) {
    console.error('Student record deletion failed:', error.message)
    return response.status(500).json({
      error: 'DATABASE_QUERY_FAILED',
      message: 'Unable to delete the student record.',
    })
  }
})
