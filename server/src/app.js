import 'dotenv/config'
import session from 'express-session'
import { timingSafeEqual } from 'node:crypto'
import { readFileSync } from 'node:fs'
import cors from 'cors'
import express from 'express'
import { checkDatabase, pool } from './db.js'
export const app = express()

// Hard-coded data for the Student Lookup exercise. These are fictional people.
// Students can edit this array to test their frontend without a database,
// SQL queries, credentials, or a .env file. Keep student IDs as strings.
// Fictional attendance records for the Module 9 Attendance API Lab.
// Stored in memory, so no database connection is required.
const attendance = [
  {
    id: 1,
    studentId: '1001',
    studentName: 'Avery Morgan',
    date: '2026-10-20',
    status: 'present',
  },
  {
    id: 2,
    studentId: '1002',
    studentName: 'Jordan Bennett',
    date: '2026-10-20',
    status: 'absent',
  },
  {
    id: 3,
    studentId: '1003',
    studentName: 'Taylor Reed',
    date: '2026-10-20',
    status: 'late',
  },
]
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
// Module 9: Return all attendance records.

app.get('/api/attendance', (_request, response) => {
  response.status(200).json(attendance)
})
// Module 9: Return one attendance record by ID.
app.get('/api/attendance/:id', (request, response) => {
  const id = parseInt(request.params.id, 10)

  const record = attendance.find((item) => item.id === id)

  if (!record) {
    return response.status(404).json({ error: 'Record not found' })
  }

  response.status(200).json(record)
})

// Allow React frontend on either Vite development port
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true
}))

app.use(express.json())

// Module 12 — Faculty session configuration
app.use(session({
  name: 'csc425.sid',
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false, // Local HTTP development only
    sameSite: 'lax',
    maxAge: 60 * 60 * 1000 // 1 hour
  }
}))

// Module 12 — Faculty API authorization
function requireFaculty(request, response, next) {
  if (request.session?.role === 'faculty') {
  return next()
}
  const expectedToken = process.env.FACULTY_API_TOKEN
  const authHeader = request.get('Authorization') || ''

  if (!expectedToken) {
    return response.status(503).json({
      error: 'FACULTY_AUTH_NOT_CONFIGURED',
      message: 'Faculty authentication is not configured.'
    })
  }

  const match = /^Bearer ([A-Za-z0-9_-]+)$/i.exec(authHeader)
  const suppliedToken = match?.[1] || ''

  const expected = Buffer.from(expectedToken)
  const supplied = Buffer.from(suppliedToken)

  const valid =
    expected.length === supplied.length &&
    timingSafeEqual(expected, supplied)

  if (!valid) {
    return response.status(403).json({
      error: 'FACULTY_ACCESS_REQUIRED',
      message: 'Faculty authorization is required.'
    })
  }

  next()
}

// Module 12 — Faculty login
app.post('/api/faculty/login', (request, response) => {
  const { token } = request.body ?? {}
  const expectedToken = process.env.FACULTY_API_TOKEN

  if (!expectedToken || !process.env.SESSION_SECRET) {
    return response.status(503).json({
      error: 'AUTH_NOT_CONFIGURED',
      message: 'Faculty login is not configured.'
    })
  }

  if (typeof token !== 'string') {
    return response.status(401).json({
      error: 'INVALID_CREDENTIALS',
      message: 'Invalid faculty credentials.'
    })
  }

  const expected = Buffer.from(expectedToken)
  const supplied = Buffer.from(token)

  const valid =
    expected.length === supplied.length &&
    timingSafeEqual(expected, supplied)

  if (!valid) {
    return response.status(401).json({
      error: 'INVALID_CREDENTIALS',
      message: 'Invalid faculty credentials.'
    })
  }

  // Regenerate the session after successful authentication.
  request.session.regenerate((error) => {
    if (error) {
      return response.status(500).json({
        error: 'SESSION_ERROR',
        message: 'Unable to create faculty session.'
      })
    }

    request.session.role = 'faculty'

    request.session.save((saveError) => {
      if (saveError) {
        return response.status(500).json({
          error: 'SESSION_ERROR',
          message: 'Unable to save faculty session.'
        })
      }

      return response.status(200).json({
        message: 'Faculty login successful.',
        role: 'faculty'
      })
    })
  })
})
// Protect faculty routes on the server.
app.use('/api/faculty', requireFaculty)
// Check whether the current browser session is authenticated
app.get('/api/faculty/session', (request, response) => {
  response.json({
    authenticated: true,
    role: 'faculty'
  })
})

// Module 12 — Faculty logout
app.post('/api/faculty/logout', (request, response) => {
  request.session.destroy((error) => {
    if (error) {
      return response.status(500).json({
        error: 'LOGOUT_FAILED',
        message: 'Unable to end faculty session.'
      })
    }

    response.clearCookie('csc425.sid', {
      path: '/',
      httpOnly: true,
      secure: false,
      sameSite: 'lax'
    })

    return response.json({
      message: 'Faculty logged out successfully.'
    })
  })
})

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
      databaseStudents: '/api/db/students',
      databaseStudentById: '/api/db/students/:id',
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

// Module 10: Retrieve students from PostgreSQL
app.get('/api/db/students', async (_request, response) => {
  try {
    const result = await pool.query(
      'SELECT * FROM students ORDER BY student_id'
    )

    response.status(200).json({
      students: result.rows,
    })
  } catch (error) {
    console.error('Failed to fetch students:', error.message)

    response.status(500).json({
      error: 'DATABASE_ERROR',
      message: 'Unable to retrieve students',
    })
  }
})

// Module 10: Create a new student in PostgreSQL
app.post('/api/db/students', async (request, response) => {
  const { student_id, first_name, last_name, email } = request.body ?? {}

  if (
    !Number.isInteger(student_id) ||
    typeof first_name !== 'string' || !first_name.trim() ||
    typeof last_name !== 'string' || !last_name.trim() ||
    typeof email !== 'string' || !email.trim()
  ) {
    return response.status(400).json({
      error: 'INVALID_INPUT',
      message: 'Provide a valid student ID, first name, last name, and email.',
    })
  }

  try {
    const result = await pool.query(
      `INSERT INTO students (student_id, first_name, last_name, email)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [student_id, first_name.trim(), last_name.trim(), email.trim()]
    )

    return response.status(201).json({
      message: 'Student created successfully',
      student: result.rows[0],
    })
  } catch (error) {
    console.error('Failed to create student:', error.message)

    if (error.code === '23505') {
      return response.status(409).json({
        error: 'DUPLICATE_STUDENT',
        message: 'Student ID or email already exists.',
      })
    }

    return response.status(500).json({
      error: 'DATABASE_ERROR',
      message: 'Unable to create student.',
    })
  }
})

// Module 10: Update an existing student in PostgreSQL
app.patch('/api/db/students/:id', async (request, response) => {
  const studentId = Number(request.params.id)
  const { first_name, last_name, email } = request.body ?? {}

  if (
    !Number.isInteger(studentId) ||
    studentId <= 0 ||
    typeof first_name !== 'string' || !first_name.trim() ||
    typeof last_name !== 'string' || !last_name.trim() ||
    typeof email !== 'string' || !email.trim()
  ) {
    return response.status(400).json({
      error: 'INVALID_INPUT',
      message: 'Provide a valid student ID, first name, last name, and email.',
    })
  }

  try {
    const result = await pool.query(
      `UPDATE students
       SET first_name = $1,
           last_name = $2,
           email = $3
       WHERE student_id = $4
       RETURNING *`,
      [first_name.trim(), last_name.trim(), email.trim(), studentId]
    )

    if (result.rows.length === 0) {
      return response.status(404).json({
        error: 'STUDENT_NOT_FOUND',
        message: 'Student does not exist.',
      })
    }

    return response.status(200).json({
      message: 'Student updated successfully',
      student: result.rows[0],
    })
  } catch (error) {
    console.error('Failed to update student:', error.message)

    if (error.code === '23505') {
      return response.status(409).json({
        error: 'DUPLICATE_EMAIL',
        message: 'Email already exists.',
      })
    }

    return response.status(500).json({
      error: 'DATABASE_ERROR',
      message: 'Unable to update student.',
    })
  }
})

// MODULE 10 — READ ONE STUDENT (GET)
app.get('/api/db/students/:id', async (request, response) => {
  const studentId = Number(request.params.id)

  if (!Number.isSafeInteger(studentId) || studentId <= 0) {
    return response.status(400).json({
      error: 'INVALID_STUDENT_ID',
    })
  }

  try {
    const result = await pool.query(
      'SELECT * FROM students WHERE student_id = $1',
      [studentId]
    )

    if (result.rows.length === 0) {
      return response.status(404).json({
        error: 'STUDENT_NOT_FOUND',
      })
    }

    return response.status(200).json({
      student: result.rows[0],
    })
  } catch (error) {
    console.error('Failed to retrieve student:', error.message)

    return response.status(500).json({
      error: 'DATABASE_ERROR',
      message: 'Unable to retrieve student.',
    })
  }
})

// MODULE 10 — DELETE STUDENT (DELETE)

app.delete('/api/db/students/:id', async (request, response) => {
  const studentId = Number(request.params.id)

  if (!Number.isSafeInteger(studentId) || studentId <= 0) {
    return response.status(400).json({
      error: 'INVALID_STUDENT_ID',
    })
  }

  try {
    const result = await pool.query(
      'DELETE FROM students WHERE student_id = $1 RETURNING *',
      [studentId]
    )

    if (result.rows.length === 0) {
      return response.status(404).json({
        error: 'STUDENT_NOT_FOUND',
      })
    }

    return response.status(200).json({
      message: 'Student deleted successfully',
      student: result.rows[0],
    })
  } catch (error) {
    console.error('Failed to delete student:', error.message)

    if (error.code === '23503') {
      return response.status(409).json({
        error: 'STUDENT_HAS_ENROLLMENTS',
        message: 'Remove student enrollments before deleting this student.',
      })
    }

    return response.status(500).json({
      error: 'DATABASE_ERROR',
      message: 'Unable to delete student.',
    })
  }
})
// Module 12 — Faculty Class Rosters
app.get('/api/faculty/rosters', async (_request, response) => {
  try {
    const result = await pool.query(`
      SELECT
        e.enrollment_id,
        e.course_code,
        s.student_id,
        s.first_name,
        s.last_name
      FROM enrollments e
      JOIN students s
        ON e.student_id = s.student_id
      ORDER BY e.course_code, s.last_name, s.first_name
    `)

    return response.status(200).json({
      rosters: result.rows
    })
  } catch (error) {
    console.error('Failed to retrieve faculty rosters:', error.message)

    return response.status(500).json({
      error: 'DATABASE_ERROR',
      message: 'Unable to retrieve faculty rosters.'
    })
  }
})


// Module 12 — Update a student's grade
app.patch('/api/faculty/grades/:enrollmentId', async (request, response) => {
  const enrollmentId = Number(request.params.enrollmentId)
  const { grade } = request.body ?? {}

  // Validate enrollment ID
  if (!Number.isSafeInteger(enrollmentId) || enrollmentId <= 0) {
    return response.status(400).json({
      error: 'INVALID_ENROLLMENT_ID',
      message: 'Provide a valid enrollment ID.'
    })
  }

  // Validate grade
  const allowedGrades = ['A', 'B', 'C', 'D', 'F']

  if (typeof grade !== 'string' || !allowedGrades.includes(grade)) {
    return response.status(400).json({
      error: 'INVALID_GRADE',
      message: 'Grade must be A, B, C, D, or F.'
    })
  }

  try {
    const result = await pool.query(
      `UPDATE enrollments
       SET grade = $1
       WHERE enrollment_id = $2
       RETURNING enrollment_id, student_id, course_code, grade`,
      [grade, enrollmentId]
    )

    if (result.rows.length === 0) {
      return response.status(404).json({
        error: 'ENROLLMENT_NOT_FOUND',
        message: 'Enrollment not found.'
      })
    }

    return response.status(200).json({
      message: 'Grade updated successfully.',
      enrollment: result.rows[0]
    })
  } catch (error) {
    console.error('Failed to update faculty grade:', error)

    return response.status(500).json({
      error: 'DATABASE_ERROR',
      message: 'Unable to update grade.'
    })
  }
})

// Module 12 — Faculty Grade Management
app.get('/api/faculty/grades', async (_request, response) => {
  try {
    const result = await pool.query(`
      SELECT
        e.enrollment_id,
        e.course_code,
        e.grade,
        s.student_id,
        s.first_name,
        s.last_name
      FROM enrollments e
      JOIN students s
        ON e.student_id = s.student_id
      ORDER BY e.course_code, s.last_name, s.first_name
    `)

    return response.status(200).json({
      grades: result.rows
    })
  } catch (error) {
    console.error('Failed to retrieve faculty grades:', error.message)

    return response.status(500).json({
      error: 'DATABASE_ERROR',
      message: 'Unable to retrieve faculty grades.'
    })
  }
})

// Module 12 — Retrieve faculty advising notes
app.get('/api/faculty/advising-notes', async (_request, response) => {
  try {
    const result = await pool.query(`
      SELECT
        n.note_id,
        n.student_id,
        s.first_name,
        s.last_name,
        n.note_text,
        n.created_at
      FROM faculty_advising_notes n
      JOIN students s
        ON n.student_id = s.student_id
      ORDER BY n.created_at DESC, n.note_id DESC
    `)

    return response.status(200).json({
      notes: result.rows
    })
  } catch (error) {
    console.error('Failed to retrieve advising notes:', error)

    return response.status(500).json({
      error: 'ADVISING_NOTES_FETCH_FAILED',
      message: 'Unable to retrieve advising notes.'
    })
  }
})

// Module 12 — Save a faculty advising note
app.post('/api/faculty/advising-notes', async (request, response) => {
  const { student_id, note_text } = request.body ?? {}

  if (
    !Number.isInteger(student_id) ||
    student_id <= 0 ||
    typeof note_text !== 'string' ||
    !note_text.trim() ||
    note_text.length > 2000
  ) {
    return response.status(400).json({
      error: 'INVALID_ADVISING_NOTE',
      message: 'Provide a valid student ID and a note of 1–2000 characters.'
    })
  }

  try {
    const result = await pool.query(
      `INSERT INTO faculty_advising_notes (student_id, note_text)
       VALUES ($1, $2)
       RETURNING note_id, student_id, note_text, created_at`,
      [student_id, note_text.trim()]
    )

    return response.status(201).json({
      message: 'Advising note saved successfully.',
      note: result.rows[0]
    })
  } catch (error) {
    if (error.code === '23503') {
      return response.status(404).json({
        error: 'STUDENT_NOT_FOUND',
        message: 'The selected student does not exist.'
      })
    }

    console.error('Failed to save advising note:', error)

    return response.status(500).json({
      error: 'ADVISING_NOTE_SAVE_FAILED',
      message: 'Unable to save advising note.'
    })
  }
})


// Module 12 — Faculty Courses
app.get('/api/faculty/courses', async (_request, response) => {
  try {
    const result = await pool.query(`
      SELECT
        course_code,
        COUNT(*)::integer AS student_count
      FROM enrollments
      GROUP BY course_code
      ORDER BY course_code
    `)

    return response.status(200).json({
      courses: result.rows
    })
  } catch (error) {
    console.error('Failed to retrieve faculty courses:', error.message)

    return response.status(500).json({
      error: 'DATABASE_ERROR',
      message: 'Unable to retrieve faculty courses.'
    })
  }
})