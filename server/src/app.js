import cors from 'cors'
import express from 'express'
import { checkDatabase, queryDatabase } from './db.js'

export const app = express()

// Only the fictional API allows requests from any frontend origin.
const teachingApi = express.Router()
teachingApi.use(['/status', '/students', '/transcripts'], cors({ methods: ['GET', 'HEAD', 'OPTIONS'] }))

function databaseUnavailable(response, error, context) {
  const code = typeof error?.code === 'string' ? error.code : undefined
  console.error(`${context}:`, code || error.message)

  const messages = {
    '28P01': 'PostgreSQL rejected the configured username or password.',
    '3D000': 'The configured PostgreSQL database does not exist.',
    ECONNREFUSED: 'Could not reach PostgreSQL at the configured host and port.',
    '42P01': 'PostgreSQL tables are missing. Run the database setup command.',
  }
  const message = messages[code] || 'PostgreSQL is unavailable. Check the server configuration and database service.'

  return response.status(503).json({
    status: 'error',
    database: 'disconnected',
    error: code || 'DATABASE_UNAVAILABLE',
    message,
  })
}

teachingApi.get('/status', async (_request, response) => {
  try {
    const result = await queryDatabase('SELECT COUNT(*)::int AS count FROM students')
    response.json({
      status: 'ok',
      service: 'PostgreSQL student transcript API',
      studentCount: result.rows[0].count,
    })
  } catch (error) {
    return databaseUnavailable(response, error, 'Database status check failed')
  }
})

teachingApi.get('/students', async (_request, response) => {
  try {
    const result = await queryDatabase(
      `SELECT student_id AS "studentID",
              first_name AS "firstName",
              last_name AS "lastName",
              major
       FROM students
       ORDER BY student_id`,
    )
    return response.json({ students: result.rows })
  } catch (error) {
    return databaseUnavailable(response, error, 'Student lookup failed')
  }
})

// Support both a path parameter and a query parameter for classroom examples.
async function getTranscript(request, response) {
  const studentID = request.params.studentID ?? request.query.studentID

  if (typeof studentID !== 'string' || !/^\d{4}$/.test(studentID)) {
    return response.status(400).json({
      error: 'INVALID_STUDENT_ID',
      message: 'Provide a four-digit studentID, for example /api/transcripts/1001.',
    })
  }

  try {
    const result = await queryDatabase(
      `SELECT s.student_id AS "studentID",
              s.first_name AS "firstName",
              s.last_name AS "lastName",
              s.major,
              t.institution,
              t.is_mock_data AS "isMockData",
              t.semesters,
              t.summary
       FROM students s
       JOIN transcripts t ON t.student_id = s.student_id
       WHERE s.student_id = $1`,
      [studentID],
    )
    if (result.rows.length === 0) {
      return response.status(404).json({
        error: 'STUDENT_NOT_FOUND',
        message: `No student was found with studentID ${studentID}.`,
      })
    }

    return response.json(result.rows[0])
  } catch (error) {
    return databaseUnavailable(response, error, 'Transcript lookup failed')
  }
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
    description: 'Student lookup and transcript data served from PostgreSQL.',
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
    return response.json({ status: 'ok', database: 'connected', timestamp: database.current_time })
  } catch (error) {
    return databaseUnavailable(response, error, 'Database health check failed')
  }
})
