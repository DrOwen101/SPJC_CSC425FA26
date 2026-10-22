import 'dotenv/config'
import { appendFile, readFileSync } from 'node:fs'
import cors from 'cors'
import express from 'express'
import { checkDatabase } from './db.js'

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

const attendance = [
  { id: 1, student: "Alice Johnson",  date: "2026-09-01", status: "present" },
  { id: 2, student: "Bob Martinez",   date: "2026-09-01", status: "absent"  },
  { id: 3, student: "Carol Williams", date: "2026-09-01", status: "late"    }
];

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
            attendance: '/api/attendance'
        },
    })
})

app.get('/api/attendance', (_request, response) => {
    if (!attendance || attendance.length === 0) {
        return response.status(404).json({ error: 'No attendance records found' });
    }

    response.status(200).json(attendance);
});

app.get('/api/attendance/:id', (_request, response) => {
  const id = parseInt(_request.params.id, 10);
  const record = attendance.find(r => r.id === id);

  if (!record) {
    return response.status(404).json({ error: 'Record not found' });
  }

  response.status(200).json(record);
});

app.get('/api/health', async (_request, response) => {
    try {
        const database = await checkDatabase()
        response.json({ status: 'ok', database: 'connected', timestamp: database.current_time })
    } catch (error) {
        console.error('Database health check failed:', error.message)
    response.status(503).json({ status: 'error', database: 'disconnected', message: error.message })
  }
})
