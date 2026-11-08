
import 'dotenv/config'
import { readFileSync } from 'node:fs'
import cors from 'cors'
import express from 'express'
import { checkDatabase, pool } from './db.js'

export const app = express()

app.use(cors({ origin: 'http://localhost:5173' }))
app.use(express.json())

const attendance = [
  {
    id: 1,
    studentId: '1001',
    studentName: 'Avery Morgan',
    date: '2026-10-20',
    status: 'present'
  },
  {
    id: 2,
    studentId: '1002',
    studentName: 'Jordan Bennett',
    date: '2026-10-20',
    status: 'absent'
  },
  {
    id: 3,
    studentId: '1003',
    studentName: 'Taylor Reed',
    date: '2026-10-20',
    status: 'late'
  }
]

const { students: transcripts } = JSON.parse(
  readFileSync(
    new URL('./data/transcripts.json', import.meta.url),
    'utf8'
  )
)

const teachingApi = express.Router()

teachingApi.get('/status', async (_request, response) => {
  try {
    const result = await pool.query(
      'SELECT COUNT(*)::integer AS count FROM students'
    )

    response.json({
      status: 'ok',
      service: 'Student Dashboard API',
      studentCount: result.rows[0].count
    })

  } catch (error) {
    console.error('Error retrieving student count:', error)

    response.status(500).json({
      error: 'Failed to retrieve student count'
    })
  }
})

// GET /api/students
// Retrieve all students from PostgreSQL

teachingApi.get('/students', async (_request, response) => {
  try {
    const result = await pool.query(`
      SELECT
        student_id AS id,
        first_name AS "firstName",
        last_name AS "lastName",
        major
      FROM students
      ORDER BY student_id
    `)

    response.json({
      students: result.rows
    })

  } catch (error) {
    console.error('Error retrieving students:', error)

    response.status(500).json({
      error: 'Failed to retrieve students'
    })
  }
})

// CREATE a student
teachingApi.post('/students', async (request, response) => {
  const { id, firstName, lastName, major } = request.body

  if (
    typeof id !== 'string' ||
    !/^\d{4}$/.test(id) ||
    ![firstName, lastName, major].every(
      value => typeof value === 'string' && value.trim().length > 0
    )
  ) {
    return response.status(400).json({
      error: 'INVALID_STUDENT_DATA'
    })
  }

  try {
    const result = await pool.query(
      `INSERT INTO students
       (student_id, first_name, last_name, major)
       VALUES ($1, $2, $3, $4)
       RETURNING
         student_id AS id,
         first_name AS "firstName",
         last_name AS "lastName",
         major`,
      [id, firstName.trim(), lastName.trim(), major.trim()]
    )

    response.status(201).json(result.rows[0])
  } catch (error) {
    if (error.code === '23505') {
      return response.status(409).json({
        error: 'STUDENT_ALREADY_EXISTS'
      })
    }

    console.error('Create student failed:', error)
    response.status(500).json({ error: 'DATABASE_ERROR' })
  }
})

// UPDATE a student
teachingApi.put('/students/:id', async (request, response) => {
  const { id } = request.params
  const { firstName, lastName, major } = request.body

  if (
    !/^\d{4}$/.test(id) ||
    ![firstName, lastName, major].every(
      value => typeof value === 'string' && value.trim().length > 0
    )
  ) {
    return response.status(400).json({
      error: 'INVALID_STUDENT_DATA'
    })
  }

  try {
    const result = await pool.query(
      `UPDATE students
       SET first_name = $1,
           last_name = $2,
           major = $3
       WHERE student_id = $4
       RETURNING
         student_id AS id,
         first_name AS "firstName",
         last_name AS "lastName",
         major`,
      [firstName.trim(), lastName.trim(), major.trim(), id]
    )

    if (result.rowCount === 0) {
      return response.status(404).json({
        error: 'STUDENT_NOT_FOUND'
      })
    }

    response.json(result.rows[0])
  } catch (error) {
    console.error('Update student failed:', error)
    response.status(500).json({ error: 'DATABASE_ERROR' })
  }
})

// DELETE a student
teachingApi.delete('/students/:id', async (request, response) => {
  const { id } = request.params

  if (!/^\d{4}$/.test(id)) {
    return response.status(400).json({
      error: 'INVALID_STUDENT_ID'
    })
  }

  try {
    const result = await pool.query(
      `DELETE FROM students
       WHERE student_id = $1
       RETURNING student_id`,
      [id]
    )

    if (result.rowCount === 0) {
      return response.status(404).json({
        error: 'STUDENT_NOT_FOUND'
      })
    }

    response.json({
      message: 'Student deleted successfully',
      id: result.rows[0].student_id
    })
  } catch (error) {
    console.error('Delete student failed:', error)
    response.status(500).json({ error: 'DATABASE_ERROR' })
  }
})

function getTranscript(request, response) {
  const studentID =
    request.params.studentID ?? request.query.studentID

  if (
    typeof studentID !== 'string' ||
    !/^\d{4}$/.test(studentID)
  ) {
    return response.status(400).json({
      error: 'INVALID_STUDENT_ID',
      message:
        'Provide a four-digit studentID, for example /api/transcripts/1001.'
    })
  }

  const student = transcripts.find(
    (student) => student.studentID === studentID
  )

  if (!student) {
    return response.status(404).json({
      error: 'STUDENT_NOT_FOUND',
      message:
        `No mock student was found with studentID ${studentID}.`
    })
  }

  return response.json(student)
}

// GET /api/transcripts?studentID=1001
teachingApi.get('/transcripts', getTranscript)

// GET /api/transcripts/1001
teachingApi.get('/transcripts/:studentID', getTranscript)

app.use('/api', teachingApi)

app.get('/', (_request, response) => {
  response.json({
    message: 'CSC 425 API',
    description:
      'Student Dashboard API with PostgreSQL student records.',
    endpoints: {
      students: '/api/students',
      transcript: '/api/transcripts/1001',
      transcriptQuery: '/api/transcripts?studentID=1001',
      attendance: '/api/attendance',
      status: '/api/status',
      databaseHealth: '/api/health'
    }
  })
})

app.get('/api/health', async (_request, response) => {
  try {
    const database = await checkDatabase()

    response.json({
      status: 'ok',
      database: 'connected',
      timestamp: database.current_time
    })

  } catch (error) {
    console.error(
      'Database health check failed:',
      error.message
    )

    response.status(503).json({
      status: 'error',
      database: 'disconnected',
      message: error.message
    })
  }
})

// Retrieve all attendance records
app.get('/api/attendance', (_request, response) => {
  response.status(200).json(attendance)
})

// Retrieve attendance for a specific student
app.get('/api/attendance/:studentId', (request, response) => {
  const studentId = request.params.studentId

  const record = attendance.find(
    (item) => item.studentId === studentId
  )

  if (!record) {
    return response.status(404).json({
      error: 'ATTENDANCE_NOT_FOUND',
      message:
        'No attendance record found for this student.'
    })
  }

  response.status(200).json(record)
})

