import 'dotenv/config'
import { readFileSync } from 'node:fs'
import cors from 'cors'
import express from 'express'
import {
  checkDatabase,
  getStudent,
  getEnrollment,
  createStudent,
  updateStudent,
  deleteStudent
} from './db.js'

export const app = express()

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
teachingApi.use(['/status', '/students', '/transcripts', '/enrollments'], cors({ methods: ['GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'OPTIONS'] }))

teachingApi.get('/status', (_request, response) => {
  response.json({ status: 'ok', service: 'Mock transcript API', studentCount: mockStudents.length })
})

teachingApi.get('/students', async (_request, response) => {
  try {
    const students = await getStudent()
    response.json({ students })
  } catch (error) {
    console.error('Failed to get students:', error.message)
    response.status(500).json({ status: 'error', message: error.message })
  }
})

teachingApi.post('/students', async (request, response) => {
  const student = request.body
  if (!student || !/^\d{4}$/.test(student.studentID ?? ``)
  || !student.firstName.trim() || !student.lastName.trim() || !student.major.trim()) {
    return response.status(400).json({ error: 'INVALID_STUDENT', message: 'Provide a valid student object with studentID, firstName, lastName, and major.' })
  }
  try {
    return response.status(201).json(await createStudent(student))
  }   catch (error) {
    if (error.code === '23505') return response.status(409).json({ error: 'STUDENT_EXISTS', message: 'A student with this ID already exists.' })
    return response.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: error.message })
  }
})

teachingApi.put('/students/:studentID', async (request, response) => {
  const { studentID } = request.params
  if(!/^\d{4}$/.test(studentID)) return response.status(400).json({
    error: 'INVALID_STUDENT_ID',
    message: 'Provide a four-digit studentID, for example /api/students/1001.',
  })
  try{
    const student = await updateStudent(studentID, request.body)
    return student ? response.json(student) : response.status(404).json({ error: 'STUDENT_NOT_FOUND', message: `No student found with ID ${studentID}.` })
  } catch (error) {
    return response.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: error.message })
  }
})

teachingApi.delete('/students/:studentID', async (request, response) => {
  if(!/^\d{4}$/.test(request.params.studentID)) {
    return response.status(400).json({
      error: 'INVALID_STUDENT_ID',
    })
  }
  try {
    const student = await deleteStudent(request.params.studentID)
    return student ? response.status(204).end() : response.status(404).json({ error: 'STUDENT_NOT_FOUND', message: `No student found with ID ${request.params.studentID}.` })
  } catch (error) {
    return response.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: error.message })
  }
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
app.use(express.json())
app.use('/api', teachingApi)

app.use(cors({ origin: 'http://localhost:5173' }))

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

// Include '/enrollments' in the paths passed to teachingApi.use(..., cors(...))

async function getEnrollmentsHandler(request, response) {
  const studentID = request.params.studentID ?? request.query.studentID

  if (typeof studentID !== 'string' || !/^\d{4}$/.test(studentID)) {
    return response.status(400).json({
      error: 'INVALID_STUDENT_ID',
      message: 'Provide a four-digit student ID.',
    })
  }

  try {
    const enrollments = await getEnrollment(studentID)
    return response.json({ enrollments })
  } catch (error) {
    console.error('Failed to get enrollments:', error.message)
    return response.status(500).json({
      error: 'ENROLLMENTS_FETCH_FAILED',
      message: 'Unable to load enrollments.',
    })
  }
}

teachingApi.get('/enrollments', getEnrollmentsHandler)
teachingApi.get('/enrollments/:studentID', getEnrollmentsHandler)