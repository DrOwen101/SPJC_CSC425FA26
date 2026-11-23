import cors from 'cors'
import express from 'express'
import { checkDatabase, queryDatabase } from './db.js'

export const app = express()

// Only the fictional API allows requests from any frontend origin.
const teachingApi = express.Router()
teachingApi.use(['/status', '/students', '/transcripts', '/faculty'], cors({
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}))
teachingApi.use(express.json())

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

teachingApi.get('/faculty/courses', async (_request, response) => {
  try {
    const result = await queryDatabase(
      `SELECT course_id AS "courseId",
              course_code AS "courseCode",
              course_title AS "courseTitle",
              section,
              term
       FROM courses
       ORDER BY course_code, section`,
    )
    return response.json({ courses: result.rows })
  } catch (error) {
    return databaseUnavailable(response, error, 'Faculty course lookup failed')
  }
})

teachingApi.get('/faculty/courses/:courseId/roster', async (request, response) => {
  const { courseId } = request.params

  if (!/^[1-9]\d*$/.test(courseId)) {
    return response.status(400).json({
      error: 'INVALID_COURSE_ID',
      message: 'Provide a positive numeric course ID.',
    })
  }

  try {
    const result = await queryDatabase(
      `SELECT s.student_id AS "studentID",
              s.first_name AS "firstName",
              s.last_name AS "lastName",
              s.major
       FROM enrollments e
       JOIN students s ON s.student_id = e.student_id
       WHERE e.course_id = $1
       ORDER BY s.last_name, s.first_name`,
      [courseId],
    )
    return response.json({ students: result.rows })
  } catch (error) {
    return databaseUnavailable(response, error, 'Faculty roster lookup failed')
  }
})

teachingApi.get('/faculty/courses/:courseId/grades', async (request, response) => {
  const { courseId } = request.params
  if (!/^[1-9]\d*$/.test(courseId)) {
    return response.status(400).json({
      error: 'INVALID_COURSE_ID',
      message: 'Provide a positive numeric course ID.',
    })
  }

  try {
    const result = await queryDatabase(
      `SELECT s.student_id AS "studentID",
              s.first_name AS "firstName",
              s.last_name AS "lastName",
              s.major,
              g.grade
       FROM enrollments e
       JOIN students s ON s.student_id = e.student_id
       LEFT JOIN course_grades g
         ON g.course_id = e.course_id AND g.student_id = e.student_id
       WHERE e.course_id = $1
       ORDER BY s.last_name, s.first_name`,
      [courseId],
    )
    return response.json({ students: result.rows })
  } catch (error) {
    return databaseUnavailable(response, error, 'Faculty grade lookup failed')
  }
})

teachingApi.put('/faculty/courses/:courseId/grades/:studentID', async (request, response) => {
  const { courseId, studentID } = request.params
  if (!/^[1-9]\d*$/.test(courseId)) {
    return response.status(400).json({
      error: 'INVALID_COURSE_ID',
      message: 'Provide a positive numeric course ID.',
    })
  }
  if (!/^\d{4}$/.test(studentID)) {
    return response.status(400).json({
      error: 'INVALID_STUDENT_ID',
      message: 'Provide a four-digit student ID.',
    })
  }
  const { grade } = request.body ?? {}
  if (!['A', 'B', 'C', 'D', 'F'].includes(grade)) {
    return response.status(400).json({
      error: 'INVALID_GRADE',
      message: 'Grade must be one of A, B, C, D, or F.',
    })
  }

  try {
    const result = await queryDatabase(
      `INSERT INTO course_grades (course_id, student_id, grade)
       SELECT $1, e.student_id, $3
       FROM enrollments e
       WHERE e.course_id = $1 AND e.student_id = $2
       ON CONFLICT (course_id, student_id)
       DO UPDATE SET grade = EXCLUDED.grade
       RETURNING student_id AS "studentID", grade`,
      [courseId, studentID, grade],
    )
    if (result.rows.length === 0) {
      return response.status(404).json({
        error: 'STUDENT_NOT_ENROLLED',
        message: 'The student is not enrolled in this course.',
      })
    }
    return response.json({ student: result.rows[0] })
  } catch (error) {
    return databaseUnavailable(response, error, 'Faculty grade save failed')
  }
})

teachingApi.get('/faculty/schedule', async (_request, response) => {
  try {
    const result = await queryDatabase(
      `SELECT fs.schedule_id AS "scheduleId",
              fs.meeting_type AS "meetingType",
              fs.course_id AS "courseId",
              c.course_code AS "courseCode",
              c.course_title AS "courseTitle",
              c.section,
              fs.day_of_week AS "dayOfWeek",
              fs.start_time AS "startTime",
              fs.end_time AS "endTime",
              fs.location
       FROM faculty_schedule fs
       LEFT JOIN courses c ON c.course_id = fs.course_id
       ORDER BY CASE fs.day_of_week
                  WHEN 'Monday' THEN 1 WHEN 'Tuesday' THEN 2
                  WHEN 'Wednesday' THEN 3 WHEN 'Thursday' THEN 4
                  WHEN 'Friday' THEN 5 WHEN 'Saturday' THEN 6 ELSE 7
                END,
                fs.start_time, fs.schedule_id`,
    )
    return response.json({ schedule: result.rows })
  } catch (error) {
    return databaseUnavailable(response, error, 'Faculty schedule lookup failed')
  }
})

teachingApi.post('/faculty/schedule', async (request, response) => {
  const {
    meetingType,
    courseId: rawCourseId,
    dayOfWeek,
    startTime,
    endTime,
    location,
  } = request.body ?? {}
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  const isTime = (value) => typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value)
  const courseId = rawCourseId === null || rawCourseId === '' ? null : Number(rawCourseId)

  if (!['class', 'office_hours'].includes(meetingType)
    || !days.includes(dayOfWeek)
    || !isTime(startTime)
    || !isTime(endTime)
    || startTime >= endTime
    || typeof location !== 'string'
    || !location.trim()
    || (meetingType === 'class' && (!Number.isInteger(courseId) || courseId < 1))
    || (meetingType === 'office_hours' && courseId !== null)) {
    return response.status(400).json({
      error: 'INVALID_SCHEDULE_ENTRY',
      message: 'Provide a valid meeting type, day, time range, location, and course for class meetings.',
    })
  }

  try {
    const result = await queryDatabase(
      `INSERT INTO faculty_schedule
         (meeting_type, course_id, day_of_week, start_time, end_time, location)
       VALUES ($1, $2, $3, $4::time, $5::time, $6)
       RETURNING schedule_id AS "scheduleId"`,
      [meetingType, courseId, dayOfWeek, startTime, endTime, location.trim()],
    )
    return response.status(201).json({ scheduleId: result.rows[0].scheduleId })
  } catch (error) {
    if (error?.code === '23503') {
      return response.status(400).json({
        error: 'INVALID_COURSE_ID',
        message: 'The selected course does not exist.',
      })
    }
    return databaseUnavailable(response, error, 'Faculty schedule save failed')
  }
})

teachingApi.delete('/faculty/schedule/:scheduleId', async (request, response) => {
  const { scheduleId } = request.params
  if (!/^[1-9]\d*$/.test(scheduleId)) {
    return response.status(400).json({
      error: 'INVALID_SCHEDULE_ID',
      message: 'Provide a positive numeric schedule ID.',
    })
  }

  try {
    const result = await queryDatabase(
      'DELETE FROM faculty_schedule WHERE schedule_id = $1 RETURNING schedule_id',
      [scheduleId],
    )
    if (result.rows.length === 0) {
      return response.status(404).json({
        error: 'SCHEDULE_ENTRY_NOT_FOUND',
        message: 'The schedule entry was not found.',
      })
    }
    return response.status(204).end()
  } catch (error) {
    return databaseUnavailable(response, error, 'Faculty schedule delete failed')
  }
})

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
