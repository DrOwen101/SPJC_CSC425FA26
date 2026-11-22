import 'dotenv/config'
import { readFileSync } from 'node:fs'
import cors from 'cors'
import express from 'express'
import { checkDatabase, pool } from './db.js'

export const app = express()
app.use(express.json())

const attendance = [
  { id: 1, studentId: '1001', studentName: 'Avery Morgan', date: '2026-10-20', status: 'present' },
  { id: 2, studentId: '1002', studentName: 'Jordan Bennett', date: '2026-10-20', status: 'absent' },
  { id: 3, studentId: '1003', studentName: 'Taylor Reed', date: '2026-10-20', status: 'late' }
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
teachingApi.use(['/status', '/students', '/transcripts'], cors({ methods: ['GET', 'POST', 'PUT', 'DELETE', 'HEAD', 'OPTIONS'] }))

teachingApi.get('/status', (_request, response) => {
  response.json({ status: 'ok', service: 'Mock transcript API', studentCount: mockStudents.length })
})

teachingApi.get('/students', async (_request, response) => {
  try {
    const result = await pool.query(
        'SELECT id, name FROM students ORDER BY id'
    )

    response.json({ students: result.rows })
  } catch (error) {
    console.error('Error getting students:', error.message)
    response.status(500).json({ error: 'Database error' })
  }
})

teachingApi.post('/students', async (request, response) => {
  try {
    const { id, name } = request.body;

    if (!Number.isInteger(id) || typeof name !== 'string' || !name.trim()) {
      return response.status(400).json({ error: 'Valid ID and name are required' });
    }

    const result = await pool.query(
      'INSERT INTO students (id, name) VALUES ($1, $2) RETURNING *',
      [id, name.trim()]
    );

    response.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error adding student:', error);
    response.status(500).json({ error: 'Database error' });
  }
});

teachingApi.put('/students/:id', async (request, response) => {
  try {
    const id = Number(request.params.id);
    const { name } = request.body;

    if (!Number.isInteger(id) || typeof name !== 'string' || !name.trim()) {
      return response.status(400).json({ error: 'Valid ID and name are required' });
    }

    const result = await pool.query(
      'UPDATE students SET name = $1 WHERE id = $2 RETURNING *',
      [name.trim(), id]
    );

    if (result.rows.length === 0) {
      return response.status(404).json({ error: 'Student not found' });
    }

    response.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating student:', error);
    response.status(500).json({ error: 'Database error' });
  }
});

teachingApi.delete('/students/:id', async (request, response) => {
  try {
    const id = Number(request.params.id);

    if (!Number.isInteger(id)) {
      return response.status(400).json({ error: 'Valid ID required' });
    }

    const result = await pool.query(
      'DELETE FROM students WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return response.status(404).json({ error: 'Student not found' });
    }

    response.json(result.rows[0]);
  } catch (error) {
    console.error('Error deleting student:', error);
    response.status(500).json({ error: 'Database error' });
  }
});

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

app.get('/api/attendance', (req, res) => {
  res.status(200).json(attendance)
})

app.get('/api/attendance/:id', (req, res) => {
  const id = Number(req.params.id)
  const record = attendance.find(r => r.id === id)

  if (!record) {
    return res.status(404).json({ error: 'Record not found' })
  }

  res.status(200).json(record)
})

const faculty = express.Router()
faculty.use(cors({ origin: 'http://localhost:5173', allowedHeaders: ['Content-Type', 'x-faculty-token'], methods: ['GET', 'POST', 'OPTIONS'] }))
faculty.use((req, res, next) => {
  const expected = process.env.FACULTY_DEMO_TOKEN
  if (!expected || req.get('x-faculty-token') !== expected) {
    return res.status(403).json({ error: 'Faculty access required' })
  }
  next()
})
// Faculty roster reuses the student directory data with a faculty-only endpoint.
faculty.get('/students', async (_req, res) => {
  try {
    const result = await pool.query('SELECT id, name FROM students ORDER BY name')
    res.json({ students: result.rows })
  } catch (e) { console.error(e); res.status(500).json({ error: 'Database error' }) }
})
// Faculty transcript viewer reuses the existing classroom transcript fixture.
faculty.get('/transcripts/:studentID', (req, res) => getTranscript(req, res))
faculty.get('/grades', async (_req, res) => {
  try {
    const result = await pool.query('SELECT id, student_id, course, grade FROM faculty_grades ORDER BY id DESC')
    res.json(result.rows)
  } catch (e) { console.error(e); res.status(500).json({ error: 'Database error' }) }
})
faculty.post('/grades', async (req, res) => {
  const { studentId, course, grade } = req.body
  if (!Number.isInteger(studentId) || typeof course !== 'string' || !course.trim() ||
      !['A','B','C','D','F'].includes(grade)) return res.status(400).json({ error: 'Valid student ID, course, and grade required' })
  try {
    const result = await pool.query(
      `INSERT INTO faculty_grades (student_id, course, grade) VALUES ($1,$2,$3)
       ON CONFLICT (student_id, course) DO UPDATE SET grade=EXCLUDED.grade RETURNING *`,
      [studentId, course.trim(), grade])
    res.status(201).json(result.rows[0])
  } catch (e) { console.error(e); res.status(500).json({ error: 'Database error or student ID not found' }) }
})
faculty.get('/announcements', async (_req, res) => {
  try {
    const result = await pool.query('SELECT id, course, message, created_at FROM faculty_announcements ORDER BY id DESC')
    res.json(result.rows)
  } catch (e) { console.error(e); res.status(500).json({ error: 'Database error' }) }
})
faculty.post('/announcements', async (req, res) => {
  const { course, message } = req.body
  if (typeof course !== 'string' || !course.trim() || typeof message !== 'string' || !message.trim())
    return res.status(400).json({ error: 'Course and message required' })
  try {
    const result = await pool.query('INSERT INTO faculty_announcements (course, message) VALUES ($1,$2) RETURNING *', [course.trim(), message.trim()])
    res.status(201).json(result.rows[0])
  } catch (e) { console.error(e); res.status(500).json({ error: 'Database error' }) }
})
app.use('/api/faculty', faculty)
