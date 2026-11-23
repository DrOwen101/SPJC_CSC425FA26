import 'dotenv/config'
import { readFileSync } from 'node:fs'
import cors from 'cors'
import express from 'express'
import {
  checkDatabase,
  ensureAttendanceTable,
  ensureFacultyScheduleTables,
  pool,
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

const mockFaculty = [
  {
    facultyId: 'F001',
    firstName: 'John',
    lastName: 'Smith',
    department: 'Computer Science',
  },
  {
    facultyId: 'F002',
    firstName: 'Emily',
    lastName: 'Johnson',
    department: 'Information Systems',
  },
  {
    facultyId: 'F003',
    firstName: 'Michael',
    lastName: 'Williams',
    department: 'Business Administration',
  },
  {
    facultyId: 'F004',
    firstName: 'Sarah',
    lastName: 'Brown',
    department: 'Mathematics',
  },
]

// The earlier transcript exercise keeps its course/grade fixtures in JSON.
// It also works without a database. /api/students uses only the array above.
const { students: transcripts } = JSON.parse(readFileSync(new URL('./data/transcripts.json', import.meta.url), 'utf8'))

// Only the fictional API allows requests from any frontend origin.
const teachingApi = express.Router()
teachingApi.use(['/status', '/students', '/transcripts', '/courses', '/faculty'], cors({ methods: ['GET', 'HEAD', 'OPTIONS'] }))

teachingApi.get('/status', (_request, response) => {
  response.json({ status: 'ok', service: 'Mock transcript API', studentCount: mockStudents.length })
})

teachingApi.get('/students', (_request, response) => {
  // Express converts the JavaScript object to JSON for the React frontend.
  // StudentLookup selects the matching full name from this returned array.
  response.json({ students: mockStudents })
})

// For the faculty schedule table interactions
teachingApi.get('/faculty', (_request, response) => {
  response.json({ faculty: mockFaculty })
})

// Read facultyId from the path and term from the query string.
teachingApi.get('/faculty/:facultyId/schedule', async (request, response) => {
  const { facultyId } = request.params
  const { term } = request.query

  if (!facultyId || typeof term !== 'string' || !term.trim()) {
    return response.status(400).json({ error: 'MISSING_PARAMETERS', message: 'Both facultyId and term are required.' })
  }

  try {
    await ensureFacultyScheduleTables()

    const facultyResult = await pool.query(
      `SELECT faculty_id AS "facultyId", first_name AS "firstName",
              last_name AS "lastName"
       FROM faculty
       WHERE faculty_id = $1`,
      [facultyId],
    )

    if (facultyResult.rows.length === 0) {
      return response.status(404).json({
        error: 'FACULTY_NOT_FOUND',
        message: `No faculty member was found with facultyId ${facultyId}.`,
      })
    }

    const scheduleResult = await pool.query(
      `SELECT
         MIN(se.schedule_id) AS "scheduleId",
         cs.section_id AS "sectionId",
         c.course_code AS "courseCode",
         c.course_title AS "courseTitle",
         cs.section_number AS "sectionNumber",
         cs.term,
         cs.delivery_mode AS "deliveryMode",
         se.meeting_day AS "meetingDay",
         se.start_time AS "startTime",
         se.end_time AS "endTime",
         se.building,
         se.room,
         se.effective_start AS "effectiveStart",
         se.effective_end AS "effectiveEnd"
       FROM faculty AS f
       JOIN course_sections AS cs
         ON cs.faculty_id = f.faculty_id
       JOIN courses AS c
         ON c.course_id = cs.course_id
       JOIN schedule_entries AS se
         ON se.section_id = cs.section_id
       WHERE f.faculty_id = $1
         AND cs.term = $2
       GROUP BY cs.section_id, c.course_code, c.course_title,
                cs.section_number, cs.term, cs.delivery_mode,
                se.meeting_day, se.start_time, se.end_time,
                se.building, se.room, se.effective_start, se.effective_end
       ORDER BY se.meeting_day, se.start_time, c.course_code`,
      [facultyId, term],
    )

    return response.json({
      faculty: facultyResult.rows[0],
      term,
      schedule: scheduleResult.rows,
    })
  } catch (error) {
    console.error('Unable to load faculty schedule:', error.message)
    return response.status(503).json({
      error: 'DATABASE_UNAVAILABLE',
      message: 'The faculty schedule could not be loaded because the database is unavailable.',
    })
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

teachingApi.get('/courses/:studentID', (request, response) => {
  const { studentID } = request.params
  if (!/^\d{4}$/.test(studentID)) {
    return response.status(400).json({
      error: 'INVALID_STUDENT_ID',
      message: 'Provide a four-digit studentID.',
    })
  }

  const student = transcripts.find((record) => record.studentID === studentID)
  if (!student) {
    return response.status(404).json({
      error: 'STUDENT_NOT_FOUND',
      message: `No mock student was found with studentID ${studentID}.`,
    })
  }

  const coursesByCode = new Map()
  for (const semester of student.semesters) {
    for (const course of semester.courses) {
      coursesByCode.set(course.courseCode, {
        courseCode: course.courseCode,
        courseTitle: course.courseTitle,
        creditHours: course.creditHours,
      })
    }
  }
  return response.json({ studentID, courses: [...coursesByCode.values()] })
})

// These handlers finish before the original starter API's CORS middleware.
app.use('/api', teachingApi)

app.use(cors({ origin: 'http://localhost:5173' }))
app.use(express.json())

app.post('/api/attendance', async (request, response) => {
  const { studentID, courseCode, attendanceDate, status } = request.body ?? {}
  const validStatuses = ['Present', 'Absent', 'Excused']

  if (typeof studentID !== 'string' || !/^\d{4}$/.test(studentID)) {
    return response.status(400).json({ error: 'INVALID_STUDENT_ID', message: 'A four-digit studentID is required.' })
  }
  if (!mockStudents.some((student) => student.studentID === studentID)) {
    return response.status(404).json({ error: 'STUDENT_NOT_FOUND', message: 'No student was found with that studentID.' })
  }
  if (typeof courseCode !== 'string' || !courseCode.trim()) {
    return response.status(400).json({ error: 'INVALID_COURSE', message: 'A courseCode is required.' })
  }
  if (typeof attendanceDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(attendanceDate)) {
    return response.status(400).json({ error: 'INVALID_DATE', message: 'attendanceDate must use YYYY-MM-DD format.' })
  }
  if (!validStatuses.includes(status)) {
    return response.status(400).json({ error: 'INVALID_STATUS', message: 'Status must be Present, Absent, or Excused.' })
  }

  const studentTranscript = transcripts.find((student) => student.studentID === studentID)
  const courseExists = studentTranscript?.semesters.some((semester) =>
    semester.courses.some((course) => course.courseCode === courseCode),
  )
  if (!courseExists) {
    return response.status(404).json({ error: 'COURSE_NOT_FOUND', message: 'The course does not belong to this student.' })
  }

  try {
    await ensureAttendanceTable()
    const result = await pool.query(
      `INSERT INTO attendance_records (student_id, course_code, attendance_date, status)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (student_id, course_code, attendance_date)
       DO UPDATE SET status = EXCLUDED.status, recorded_at = NOW()
       RETURNING id, student_id AS "studentID", course_code AS "courseCode",
                 attendance_date::text AS "attendanceDate", status, recorded_at AS "recordedAt"`,
      [studentID, courseCode, attendanceDate, status],
    )
    return response.status(200).json({ record: result.rows[0] })
  } catch (error) {
    console.error('Unable to save attendance record:', error.message)
    return response.status(503).json({
      error: 'DATABASE_UNAVAILABLE',
      message: 'Attendance could not be saved because the database is unavailable.',
    })
  }
})

app.get('/api/attendance', async (request, response) => {
  const studentID = typeof request.query.studentID === 'string' ? request.query.studentID : undefined
  if (studentID && !/^\d{4}$/.test(studentID)) {
    return response.status(400).json({ error: 'INVALID_STUDENT_ID', message: 'studentID must contain four digits.' })
  }

  try {
    await ensureAttendanceTable()
    const values = studentID ? [studentID] : []
    const whereClause = studentID ? 'WHERE student_id = $1' : ''
    const result = await pool.query(
      `SELECT id, student_id AS "studentID", course_code AS "courseCode",
              attendance_date::text AS "attendanceDate", status, recorded_at AS "recordedAt"
       FROM attendance_records
       ${whereClause}
       ORDER BY attendance_date DESC, recorded_at DESC
       LIMIT 200`,
      values,
    )
    return response.json({ records: result.rows })
  } catch (error) {
    console.error('Unable to load attendance records:', error.message)
    return response.status(503).json({
      error: 'DATABASE_UNAVAILABLE',
      message: 'Attendance records could not be loaded because the database is unavailable.',
    })
  }
})

app.get('/', (_request, response) => {
  response.json({
    message: 'CSC 425 API',
    description: 'Fictional student transcripts for frontend practice. No API key required.',
    endpoints: {
      students: '/api/students',
      transcript: '/api/transcripts/1001',
      transcriptQuery: '/api/transcripts?studentID=1001',
      courses: '/api/courses/1001',
      attendance: '/api/attendance',
      status: '/api/status',
      databaseHealth: '/api/health',
      facultySchedule: '/api/faculty/:facultyId/schedule',
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
