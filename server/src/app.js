import 'dotenv/config'
import { readFileSync } from 'node:fs'
import cors from 'cors'
import express from 'express'
import { checkDatabase } from './db.js'
import pool from './db.js'

export const app = express()

app.use(express.json())

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

// Route to fetch a student from the SQL database
app.get('/api/db/students/:studentID', async (request, response) => {
  const studentID = Number(request.params.studentID)

  if (!Number.isSafeInteger(studentID)) {
    return response.status(400).json({ error: 'INVALID_STUDENT_ID' })
  }

  const result = await pool.query(
    'SELECT studentID, firstName, lastName, major, institution FROM students WHERE studentID = $1',
    [studentID],
  )

  if (result.rowCount === 0) {
    return response.status(404).json({ error: 'STUDENT_NOT_FOUND' })
  }

  return response.json(result.rows[0])
})

// Route to fetch a list of classes for a student from the SQL database using enrollment data
app.get('/api/db/students/:studentID/classes', async (request, response) => {
  const studentID = Number(request.params.studentID)

  if (!Number.isSafeInteger(studentID)) {
    return response.status(400).json({ error: 'INVALID_STUDENT_ID' })
  } 

  const result = await pool.query(
    `SELECT e.term, c.courseID, c.courseName, c.instructor
     FROM classes c
     JOIN enrollments e ON c.courseID = e.courseID
     WHERE e.studentID = $1`,
    [studentID],
  )

  return response.json({ classes: result.rows })
})

// Route to create a new student in the SQL database
app.post('/api/db/students', async (request, response) => {
  const { studentID, firstName, lastName, major, institution } = request.body

  if (!studentID || !firstName || !lastName || !major || !institution) {
    return response.status(400).json({ error: 'MISSING_FIELDS' })
  }

  try {
    const result = await pool.query(
      'INSERT INTO students (studentID, firstName, lastName, major, institution) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [studentID, firstName, lastName, major, institution],
    )

    return response.status(201).json(result.rows[0])
  }
  catch (error) {
    if (error.code === '23505') { // Unique violation error code in PostgreSQL
      return response.status(409).json({ error: 'STUDENT_ALREADY_EXISTS' })
    }
    console.error('Error creating student:', error)
    return response.status(500).json({ error: 'INTERNAL_SERVER_ERROR' })
  }

})

// Route to update an existing student in the SQL database
app.put('/api/db/students/:studentID', async (request, response) => {
  const studentID = Number(request.params.studentID)
  const { firstName, lastName, major, institution } = request.body

  if (!Number.isSafeInteger(studentID)) {
    return response.status(400).json({ error: 'INVALID_STUDENT_ID' })
  }

  try {
    const result = await pool.query(
      'UPDATE students SET firstName = $1, lastName = $2, major = $3, institution = $4 WHERE studentID = $5 RETURNING *',
      [firstName, lastName, major, institution, studentID],
    )
    return response.status(200).json(result.rows[0])
  }
  catch (error) {
    console.error('Error updating student:', error)
    return response.status(500).json({ error: 'INTERNAL_SERVER_ERROR' })
  }
  
})

// Route to delete a student from the SQL database
app.delete('/api/db/students/:studentID', async (request, response) => {
  const studentID = Number(request.params.studentID)

  if (!Number.isSafeInteger(studentID)) {
    return response.status(400).json({ error: 'INVALID_STUDENT_ID' })
  }

  try {
    const result = await pool.query(
      'DELETE FROM students WHERE studentID = $1 RETURNING *',
      [studentID],
    )
    return response.status(204).json()
  }
  catch(error) {
    console.error('Error deleting student:', error)
    return response.status(500).json({ error: 'INTERNAL_SERVER_ERROR' })
  }

  if (result.rowCount === 0) {
    return response.status(404).json({ error: 'STUDENT_NOT_FOUND' })
  }
})

// Route to enroll a student in a class in the SQL database
app.post('/api/db/students/:studentID/classes', async (request, response) => {
  const studentID = Number(request.params.studentID)
  const { courseID, term } = request.body

  if (!Number.isSafeInteger(studentID) || !courseID || !term) {
    return response.status(400).json({ error: 'INVALID_INPUT' })
  }

  try {
    const result = await pool.query(
      'INSERT INTO enrollments (studentID, courseID, term) VALUES ($1, $2, $3) RETURNING *',
      [studentID, courseID, term],
    )
  return response.status(201).json(result.rows[0])
  }
  catch (error) {
    if (error.code === '23505') { // Unique violation error code in PostgreSQL
      return response.status(409).json({ error: 'ENROLLMENT_ALREADY_EXISTS' })
    }
    console.error('Error creating enrollment:', error)
    return response.status(500).json({ error: 'INTERNAL_SERVER_ERROR' })
  }
})

// Route to unenroll a student from a class in the SQL database
app.delete('/api/db/students/:studentID/classes/:courseID', async (request, response) => {
  const studentID = Number(request.params.studentID)
  const courseID = request.params.courseID

  if (!Number.isSafeInteger(studentID) || !courseID) {
    return response.status(400).json({ error: 'INVALID_INPUT' })
  }

  try {
    const result = await pool.query(
      'DELETE FROM enrollments WHERE studentID = $1 AND courseID = $2 RETURNING *',
      [studentID, courseID],
    )
  return response.status(204).json()
  }
  catch (error) {
    console.error('Error deleting enrollment:', error)
    return response.status(500).json({ error: 'INTERNAL_SERVER_ERROR' })
  }

  if (result.rowCount === 0) {
    return response.status(404).json({ error: 'ENROLLMENT_NOT_FOUND' })
  }
})