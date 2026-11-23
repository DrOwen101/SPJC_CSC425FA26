import 'dotenv/config'
import { readFileSync } from 'node:fs'
import { randomBytes } from 'node:crypto'
import cors from 'cors'
import express from 'express'
import session from 'express-session'
import { checkDatabase, pool } from './db.js'

export const app =  express()
const DEMO_FACULTY_ID = 'demo-faculty'

if (process.env.NODE_ENV === 'production' && !process.env.SESSION_SECRET) {
  throw new Error('SESSION_SECRET must be set in production.')
}

const sessionSecret = process.env.SESSION_SECRET || randomBytes(32).toString('hex')

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

app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  credentials: true,
}))
app.use(express.json())
app.use(session({
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 8 * 60 * 60 * 1000,
  },
}))

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

app.post('/api/faculty/login', (request, response) => {
  const { username, password } = request.body ?? {}

  if (!process.env.FACULTY_USERNAME || !process.env.FACULTY_PASSWORD) {
    return response.status(503).json({ error: 'Faculty login is not configured.' })
  }
  if (username !== process.env.FACULTY_USERNAME || password !== process.env.FACULTY_PASSWORD) {
    return response.status(401).json({ error: 'Invalid username or password.' })
  }

  request.session.regenerate((error) => {
    if (error) {
      console.error('Faculty session creation failed:', error.message)
      return response.status(500).json({ error: 'Unable to start a faculty session.' })
    }

    request.session.facultyId = DEMO_FACULTY_ID
    request.session.save((saveError) => {
      if (saveError) {
        console.error('Faculty session save failed:', saveError.message)
        return response.status(500).json({ error: 'Unable to save the faculty session.' })
      }
      return response.json({ authenticated: true })
    })
  })
})

app.get('/api/faculty/session', (request, response) => {
  if (request.session.facultyId !== DEMO_FACULTY_ID) {
    return response.status(401).json({ error: 'Faculty login required.' })
  }
  return response.json({ authenticated: true })
})

app.post('/api/faculty/logout', (request, response) => {
  request.session.destroy((error) => {
    response.clearCookie('connect.sid', {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    })
    if (error) {
      console.error('Faculty logout failed:', error.message)
      return response.status(500).json({ error: 'Unable to end the faculty session.' })
    }
    return response.status(204).end()
  })
})

app.use('/api/faculty', (request, response, next) => {
  if (request.session.facultyId !== DEMO_FACULTY_ID) {
    return response.status(401).json({ error: 'Faculty login required.' })
  }
  return next()
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

app.get('/api/faculty/courses', async (_request, response) => {
  try {
    const result = await pool.query(
      `SELECT section.section_id AS "sectionId",
              section.course_code AS "courseCode",
              section.term,
              section.section_name AS "sectionName"
       FROM course_sections AS section
       JOIN faculty_course_assignments AS assignment
         ON assignment.section_id = section.section_id
       WHERE assignment.faculty_id = $1
       ORDER BY section.term, section.course_code`,
      [DEMO_FACULTY_ID],
    )
    return response.json({ courses: result.rows })
  } catch (error) {
    console.error('Faculty courses query failed:', error.message)
    return response.status(500).json({ error: 'Unable to load faculty courses.' })
  }
})

app.get('/api/faculty/courses/:sectionId/roster', async (request, response) => {
  const { sectionId } = request.params
  if (!/^\d+$/.test(sectionId)) {
    return response.status(400).json({ error: 'Section ID must be a number.' })
  }

  try {
    const result = await pool.query(
      `SELECT student.student_id AS "studentID",
              student.first_name AS "firstName",
              student.last_name AS "lastName",
              student.major
       FROM course_enrollments AS enrollment
       JOIN course_sections AS section ON section.section_id = enrollment.section_id
       JOIN faculty_course_assignments AS assignment
         ON assignment.section_id = section.section_id
       JOIN students AS student ON student.student_id = enrollment.student_id
       WHERE section.section_id = $1
         AND assignment.faculty_id = $2
       ORDER BY student.last_name, student.first_name`,
      [sectionId, DEMO_FACULTY_ID],
    )
    return response.json({ students: result.rows })
  } catch (error) {
    console.error('Faculty roster query failed:', error.message)
    return response.status(500).json({ error: 'Unable to load this class roster.' })
  }
})

app.get('/api/faculty/courses/:sectionId/gradebook', async (request, response) => {
  const { sectionId } = request.params
  if (!/^\d+$/.test(sectionId)) {
    return response.status(400).json({ error: 'Section ID must be a number.' })
  }

  try {
    const result = await pool.query(
      `SELECT record.record_id AS "recordId",
              student.student_id AS "studentID",
              student.first_name AS "firstName",
              student.last_name AS "lastName",
              record.grade
       FROM course_sections AS section
       JOIN faculty_course_assignments AS assignment
         ON assignment.section_id = section.section_id
       JOIN course_enrollments AS enrollment
         ON enrollment.section_id = section.section_id
       JOIN students AS student ON student.student_id = enrollment.student_id
       JOIN academic_records AS record
         ON record.student_id = enrollment.student_id
        AND record.course_code = section.course_code
        AND record.term = section.term
       WHERE section.section_id = $1
         AND assignment.faculty_id = $2
       ORDER BY student.last_name, student.first_name`,
      [sectionId, DEMO_FACULTY_ID],
    )
    return response.json({ records: result.rows })
  } catch (error) {
    console.error('Faculty gradebook query failed:', error.message)
    return response.status(500).json({ error: 'Unable to load this gradebook.' })
  }
})

app.put('/api/faculty/courses/:sectionId/records/:recordId/grade', async (request, response) => {
  const { sectionId, recordId } = request.params
  const { grade } = request.body ?? {}

  if (!/^\d+$/.test(sectionId) || !/^\d+$/.test(recordId)) {
    return response.status(400).json({ error: 'Section and record IDs must be numbers.' })
  }
  if (!validGrades.includes(grade)) {
    return response.status(400).json({ error: 'Choose a valid letter grade.' })
  }

  try {
    const result = await pool.query(
      `UPDATE academic_records AS record
       SET grade = $1
       FROM course_sections AS section
       JOIN faculty_course_assignments AS assignment
         ON assignment.section_id = section.section_id
       JOIN course_enrollments AS enrollment
         ON enrollment.section_id = section.section_id
       WHERE record.record_id = $2
         AND section.section_id = $3
         AND assignment.faculty_id = $4
         AND enrollment.student_id = record.student_id
         AND section.course_code = record.course_code
         AND section.term = record.term
       RETURNING record.record_id AS "recordId", record.grade`,
      [grade, recordId, sectionId, DEMO_FACULTY_ID],
    )

    if (result.rowCount === 0) {
      return response.status(404).json({ error: 'Grade record not found in this course.' })
    }
    return response.json({ record: result.rows[0] })
  } catch (error) {
    console.error('Faculty grade update failed:', error.message)
    return response.status(500).json({ error: 'Unable to save this grade.' })
  }
})

app.get('/api/faculty/students/:studentID/progress', async (request, response) => {
  const { studentID } = request.params
  if (!/^\d{4}$/.test(studentID)) {
    return response.status(400).json({ error: 'Student ID must be four digits.' })
  }

  try {
    const result = await pool.query(
      `SELECT student.student_id AS "studentID",
              student.first_name AS "firstName",
              student.last_name AS "lastName",
              student.major,
              section.term,
              record.course_code AS "courseCode",
              record.grade,
              record.credit_hours AS "creditHours"
       FROM students AS student
       JOIN course_enrollments AS enrollment
         ON enrollment.student_id = student.student_id
       JOIN course_sections AS section
         ON section.section_id = enrollment.section_id
       JOIN faculty_course_assignments AS assignment
         ON assignment.section_id = section.section_id
       JOIN academic_records AS record
         ON record.student_id = student.student_id
        AND record.course_code = section.course_code
        AND record.term = section.term
       WHERE student.student_id = $1
         AND assignment.faculty_id = $2
       ORDER BY section.term, record.record_id`,
      [studentID, DEMO_FACULTY_ID],
    )

    if (result.rows.length === 0) {
      return response.status(404).json({
        error: 'No student records found in the faculty courses.',
      })
    }

    const student = result.rows[0]
    const gradePoints = {
      'A+': 4, A: 4, 'A-': 3.7,
      'B+': 3.3, B: 3, 'B-': 2.7,
      'C+': 2.3, C: 2, 'C-': 1.7,
      'D+': 1.3, D: 1, 'D-': 0.7,
      F: 0,
    }
    const semesters = []
    let totalCredits = 0
    let totalQualityPoints = 0

    for (const row of result.rows) {
      let semester = semesters.find((item) => item.term === row.term)
      if (!semester) {
        semester = {
          term: row.term,
          courses: [],
          creditsAttempted: 0,
          creditsEarned: 0,
          qualityPoints: 0,
        }
        semesters.push(semester)
      }

      const credits = Number(row.creditHours)
      const qualityPoints = credits * gradePoints[row.grade]
      semester.courses.push({
        courseCode: row.courseCode,
        courseTitle: row.courseCode,
        creditHours: credits,
        grade: row.grade,
      })
      semester.creditsAttempted += credits
      semester.creditsEarned += row.grade === 'F' ? 0 : credits
      semester.qualityPoints += qualityPoints
      totalCredits += credits
      totalQualityPoints += qualityPoints
    }

    for (const semester of semesters) {
      semester.gpa = Number((semester.qualityPoints / semester.creditsAttempted).toFixed(2))
      delete semester.qualityPoints
    }

    return response.json({
      studentID: student.studentID,
      firstName: student.firstName,
      lastName: student.lastName,
      major: student.major,
      institution: 'SPJC',
      isMockData: false,
      semesters,
      summary: {
        creditsAttempted: totalCredits,
        creditsEarned: semesters.reduce((sum, semester) => sum + semester.creditsEarned, 0),
        cumulativeGPA: Number((totalQualityPoints / totalCredits).toFixed(2)),
      },
    })
  } catch (error) {
    console.error('Faculty student progress query failed:', error.message)
    return response.status(500).json({ error: 'Unable to load student progress.' })
  }
})
