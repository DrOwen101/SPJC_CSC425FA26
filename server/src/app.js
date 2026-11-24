import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import crypto from 'node:crypto'
import { promisify } from 'node:util'
import { checkDatabase, pool } from './db.js'

export const app = express()

const api = express.Router()
const scrypt = promisify(crypto.scrypt)
const SESSION_LIFETIME_MS = 8 * 60 * 60 * 1000
const gradePoints = {
  'A+': 4,
  A: 4,
  'A-': 3.7,
  'B+': 3.3,
  B: 3,
  'B-': 2.7,
  'C+': 2.3,
  C: 2,
  'C-': 1.7,
  'D+': 1.3,
  D: 1,
  'D-': 0.7,
  F: 0,
}

app.use(express.json())
app.use('/api', cors({
  origin: '*',
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}), api)

async function hashPassword(password, salt) {
  const derived = await scrypt(password, salt, 64)
  return Buffer.from(derived).toString('base64')
}

async function ensureFacultyAuthTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS faculty_accounts (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_salt TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS faculty_sessions (
      token_hash TEXT PRIMARY KEY,
      faculty_id INTEGER NOT NULL REFERENCES faculty_accounts(id) ON DELETE CASCADE,
      expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `)

  // The password is never stored: only the random salt and derived scrypt hash are.
  const username = (process.env.FACULTY_USERNAME || 'faculty').trim().toLowerCase()
  const password = process.env.FACULTY_PASSWORD
  if (!password || password === 'replace_with_a_strong_faculty_password') {
    throw new Error('FACULTY_PASSWORD must be configured')
  }
  const existing = await pool.query(
    'SELECT id FROM faculty_accounts WHERE username = $1',
    [username],
  )
  if (existing.rowCount === 0) {
    const salt = crypto.randomBytes(16).toString('base64')
    const passwordHash = await hashPassword(password, salt)
    await pool.query(`
      INSERT INTO faculty_accounts (username, password_salt, password_hash)
      VALUES ($1, $2, $3)
    `, [username, salt, passwordHash])
  }
}

function sessionTokenHash(token) {
  return crypto.createHash('sha256').update(token).digest('base64')
}

async function requireFaculty(request, response, next) {
  const authorization = request.get('Authorization')
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : ''
  if (!token) {
    return response.status(403).json({
      error: 'FORBIDDEN',
      message: 'Faculty login required.',
    })
  }

  try {
    await ensureFacultyAuthTables()
    const result = await pool.query(`
      SELECT s.faculty_id
      FROM faculty_sessions s
      JOIN faculty_accounts f ON f.id = s.faculty_id
      WHERE s.token_hash = $1 AND s.expires_at > NOW()
    `, [sessionTokenHash(token)])
    if (result.rowCount === 0) {
      return response.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'Your faculty session is missing or expired.',
      })
    }
    request.facultyId = result.rows[0].faculty_id
    next()
  } catch (error) {
    response.status(503).json({
      error: 'AUTH_SERVICE_UNAVAILABLE',
      message: 'Unable to verify faculty authentication.',
    })
  }
}

async function ensureFacultyTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS faculty_advising_notes (
      id SERIAL PRIMARY KEY,
      student_id INTEGER NOT NULL,
      note TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS faculty_grading_submissions (
      id SERIAL PRIMARY KEY,
      student_id INTEGER NOT NULL,
      course_code TEXT NOT NULL,
      grade TEXT NOT NULL,
      feedback TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'submitted',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS faculty_course_assignments (
      id SERIAL PRIMARY KEY,
      course_code TEXT UNIQUE NOT NULL,
      course_title TEXT NOT NULL,
      section TEXT NOT NULL,
      meeting_day TEXT NOT NULL,
      meeting_time TEXT NOT NULL,
      location TEXT NOT NULL,
      faculty_name TEXT NOT NULL DEFAULT 'Faculty',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `)
}

app.get('/', (_request, response) => {
  response.json({
    message: 'CSC 425 API',
    description: 'Fictional student and academic data stored in PostgreSQL.',
    endpoints: {
      students: '/api/students',
      transcript: '/api/transcripts/1001',
      transcriptQuery: '/api/transcripts?studentID=1001',
      status: '/api/status',
      databaseHealth: '/api/health',
      attendance: '/api/attendance',
    },
  })
})

api.get('/status', async (_request, response) => {
  const result = await pool.query('SELECT count(*)::integer AS student_count FROM students')
  response.json({
    status: 'ok',
    service: 'Mock transcript API',
    studentCount: result.rows[0].student_count,
  })
})

api.get('/students', async (_request, response) => {
  const result = await pool.query(`
    SELECT student_id, first_name, last_name, major
    FROM students
    ORDER BY student_id
  `)

  response.json({
    students: result.rows.map((student) => ({
      studentID: String(student.student_id),
      firstName: student.first_name,
      lastName: student.last_name,
      major: student.major,
    })),
  })
})

async function getTranscript(request, response) {
  const studentID = request.params.studentID ?? request.query.studentID
  if (typeof studentID !== 'string' || !/^\d{4}$/.test(studentID)) {
    return response.status(400).json({
      error: 'INVALID_STUDENT_ID',
      message: 'Provide a four-digit studentID, for example /api/transcripts/1001.',
    })
  }

  const studentResult = await pool.query(`
    SELECT student_id, first_name, last_name, major, institution
    FROM students
    WHERE student_id = $1
  `, [Number(studentID)])
  if (studentResult.rowCount === 0) {
    return response.status(404).json({
      error: 'STUDENT_NOT_FOUND',
      message: `No student was found with studentID ${studentID}.`,
    })
  }

  const courseResult = await pool.query(`
    SELECT t.term_name, t.sort_order, c.course_code, c.course_title,
           c.credit_hours, e.grade
    FROM enrollments e
    JOIN terms t ON t.term_id = e.term_id
    JOIN courses c ON c.course_code = e.course_code
    WHERE e.student_id = $1
    ORDER BY t.sort_order, c.course_code
  `, [Number(studentID)])

  const student = studentResult.rows[0]
  const semesters = []
  for (const row of courseResult.rows) {
    let semester = semesters.at(-1)
    if (!semester || semester.term !== row.term_name) {
      semester = {
        term: row.term_name,
        courses: [],
        creditsAttempted: 0,
        creditsEarned: 0,
        qualityPoints: 0,
      }
      semesters.push(semester)
    }

    semester.courses.push({
      courseCode: row.course_code,
      courseTitle: row.course_title,
      creditHours: row.credit_hours,
      grade: row.grade,
    })
    semester.creditsAttempted += row.credit_hours
    if (row.grade !== 'F') semester.creditsEarned += row.credit_hours
    semester.qualityPoints += row.credit_hours * gradePoints[row.grade]
  }

  let creditsAttempted = 0
  let creditsEarned = 0
  let qualityPoints = 0
  for (const semester of semesters) {
    creditsAttempted += semester.creditsAttempted
    creditsEarned += semester.creditsEarned
    qualityPoints += semester.qualityPoints
    semester.gpa = Number((semester.qualityPoints / semester.creditsAttempted).toFixed(2))
    delete semester.qualityPoints
  }

  response.json({
    studentID: String(student.student_id),
    firstName: student.first_name,
    lastName: student.last_name,
    major: student.major,
    institution: student.institution,
    isMockData: true,
    semesters,
    summary: {
      creditsAttempted,
      creditsEarned,
      cumulativeGPA: creditsAttempted ? Number((qualityPoints / creditsAttempted).toFixed(2)) : 0,
    },
  })
}

api.get('/transcripts', getTranscript)
api.get('/transcripts/:studentID', getTranscript)

api.get('/attendance', async (_request, response) => {
  const result = await pool.query(`
    SELECT a.id, s.first_name, s.last_name,
           to_char(a.attendance_date, 'YYYY-MM-DD') AS attendance_date, a.status
    FROM attendance_records a
    JOIN students s ON s.student_id = a.student_id
    ORDER BY a.attendance_date, a.id
  `)

  response.json(result.rows.map((record) => ({
    id: record.id,
    student: `${record.first_name} ${record.last_name}`,
    date: record.attendance_date,
    status: record.status,
  })))
})

api.post('/attendance', async (request, response) => {
  const { studentID, date, status } = request.body ?? {}
  if (
    typeof studentID !== 'string'
    || !/^\d{4}$/.test(studentID)
    || typeof date !== 'string'
    || !/^\d{4}-\d{2}-\d{2}$/.test(date)
    || Number.isNaN(Date.parse(`${date}T00:00:00Z`))
    || new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) !== date
    || !['present', 'absent', 'late'].includes(status)
  ) {
    return response.status(400).json({
      error: 'INVALID_ATTENDANCE',
      message: 'Provide a four-digit studentID, a valid YYYY-MM-DD date, and status present, absent, or late.',
    })
  }

  const studentResult = await pool.query(`
    SELECT student_id, first_name, last_name
    FROM students
    WHERE student_id = $1
  `, [Number(studentID)])
  if (studentResult.rowCount === 0) {
    return response.status(404).json({
      error: 'STUDENT_NOT_FOUND',
      message: `No student was found with studentID ${studentID}.`,
    })
  }

  const result = await pool.query(`
    INSERT INTO attendance_records (student_id, attendance_date, status)
    VALUES ($1, $2, $3)
    ON CONFLICT (student_id, attendance_date)
    DO UPDATE SET status = EXCLUDED.status
    RETURNING id, student_id, to_char(attendance_date, 'YYYY-MM-DD') AS attendance_date, status
  `, [Number(studentID), date, status])

  const record = result.rows[0]
  const student = studentResult.rows[0]
  console.info('Attendance record saved', {
    id: record.id,
    studentID: String(record.student_id),
    date: record.attendance_date,
  })
  response.json({
    id: record.id,
    studentID: String(record.student_id),
    student: `${student.first_name} ${student.last_name}`,
    date: record.attendance_date,
    status: record.status,
  })
})

api.get('/attendance/:id', async (request, response) => {
  if (!/^[1-9]\d*$/.test(request.params.id)) {
    return response.status(400).json({ error: 'INVALID_ATTENDANCE_ID' })
  }

  const result = await pool.query(`
    SELECT a.id, s.first_name, s.last_name,
           to_char(a.attendance_date, 'YYYY-MM-DD') AS attendance_date, a.status
    FROM attendance_records a
    JOIN students s ON s.student_id = a.student_id
    WHERE a.id = $1
  `, [Number(request.params.id)])
  if (result.rowCount === 0) {
    return response.status(404).json({ error: 'ATTENDANCE_NOT_FOUND' })
  }

  const record = result.rows[0]
  response.json({
    id: record.id,
    student: `${record.first_name} ${record.last_name}`,
    date: record.attendance_date,
    status: record.status,
  })
})

api.delete('/attendance/:id', async (request, response) => {
  if (!/^[1-9]\d*$/.test(request.params.id)) {
    return response.status(400).json({ error: 'INVALID_ATTENDANCE_ID' })
  }

  const result = await pool.query(`
    DELETE FROM attendance_records a
    USING students s
    WHERE a.id = $1 AND s.student_id = a.student_id
    RETURNING a.id, a.student_id, s.first_name, s.last_name,
              to_char(a.attendance_date, 'YYYY-MM-DD') AS attendance_date, a.status
  `, [Number(request.params.id)])
  if (result.rowCount === 0) {
    return response.status(404).json({
      error: 'ATTENDANCE_NOT_FOUND',
      message: `No attendance record was found with ID ${request.params.id}.`,
    })
  }

  const record = result.rows[0]
  console.info('Attendance record deleted', { id: record.id })
  response.json({
    id: record.id,
    studentID: String(record.student_id),
    student: `${record.first_name} ${record.last_name}`,
    date: record.attendance_date,
    status: record.status,
    deleted: true,
  })
})

// Faculty-only teaching assignments. This repurposes the student's upcoming
// courses module into faculty-owned section assignments.
api.get('/faculty/assignments', requireFaculty, async (_request, response) => {
  await ensureFacultyTables()
  await pool.query(`
    INSERT INTO faculty_course_assignments
      (course_code, course_title, section, meeting_day, meeting_time, location)
    VALUES
      ('CS101', 'Introduction to Computer Science', 'Section A', 'Mon/Wed', '9:00 AM', 'Science 204'),
      ('MAT201', 'Calculus I', 'Section B', 'Tue/Thu', '11:00 AM', 'Math 110')
    ON CONFLICT (course_code) DO NOTHING
  `)
  const result = await pool.query(`
    SELECT id, course_code, course_title, section, meeting_day,
           meeting_time, location, faculty_name
    FROM faculty_course_assignments
    ORDER BY course_code
  `)
  response.json(result.rows.map((row) => ({
    id: row.id,
    courseCode: row.course_code,
    courseTitle: row.course_title,
    section: row.section,
    meetingDay: row.meeting_day,
    meetingTime: row.meeting_time,
    location: row.location,
    facultyName: row.faculty_name,
  })))
})

// Repurposed from the student attendance module: faculty can view and update
// attendance for students on a selected date.
api.get('/faculty/roster', requireFaculty, async (request, response) => {
  const date = request.query.date
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return response.status(400).json({
      error: 'INVALID_DATE',
      message: 'Provide a valid YYYY-MM-DD date.',
    })
  }
  const result = await pool.query(`
    SELECT s.student_id, s.first_name, s.last_name, s.major,
           a.id, a.status
    FROM students s
    LEFT JOIN attendance_records a
      ON a.student_id = s.student_id
     AND a.attendance_date = $1
    ORDER BY s.last_name, s.first_name
  `, [date])
  response.json(result.rows.map((row) => ({
    studentID: String(row.student_id),
    student: `${row.first_name} ${row.last_name}`,
    major: row.major,
    attendanceID: row.id,
    status: row.status || 'present',
  })))
})

api.post('/faculty/roster', requireFaculty, async (request, response) => {
  const { studentID, date, status } = request.body ?? {}
  if (typeof studentID !== 'string' || !/^\d{4}$/.test(studentID)
    || typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)
    || !['present', 'absent', 'late'].includes(status)) {
    return response.status(400).json({
      error: 'INVALID_ATTENDANCE',
      message: 'Provide a four-digit studentID, valid date, and attendance status.',
    })
  }
  const result = await pool.query(`
    INSERT INTO attendance_records (student_id, attendance_date, status)
    VALUES ($1, $2, $3)
    ON CONFLICT (student_id, attendance_date)
    DO UPDATE SET status = EXCLUDED.status
    RETURNING id, student_id, to_char(attendance_date, 'YYYY-MM-DD') AS attendance_date, status
  `, [Number(studentID), date, status])
  const row = result.rows[0]
  response.json({
    id: row.id,
    studentID: String(row.student_id),
    date: row.attendance_date,
    status: row.status,
  })
})

// Faculty-only advising workflow: create and review persistent follow-up notes.
api.get('/faculty/advising', requireFaculty, async (_request, response) => {
  await ensureFacultyTables()
  const result = await pool.query(`
    SELECT n.id, n.student_id, s.first_name, s.last_name,
           n.note, n.status, n.created_at
    FROM faculty_advising_notes n
    LEFT JOIN students s ON s.student_id = n.student_id
    ORDER BY n.created_at DESC
  `)
  response.json(result.rows.map((row) => ({
    id: row.id,
    studentID: String(row.student_id),
    student: row.first_name ? `${row.first_name} ${row.last_name}` : `Student ${row.student_id}`,
    note: row.note,
    status: row.status,
    createdAt: row.created_at,
  })))
})

api.post('/faculty/advising', requireFaculty, async (request, response) => {
  await ensureFacultyTables()
  const { studentID, note } = request.body ?? {}
  if (typeof studentID !== 'string' || !/^\d{4}$/.test(studentID)
    || typeof note !== 'string' || !note.trim()) {
    return response.status(400).json({
      error: 'INVALID_ADVISING_NOTE',
      message: 'Provide a four-digit studentID and a non-empty advising note.',
    })
  }
  const student = await pool.query(
    'SELECT student_id, first_name, last_name FROM students WHERE student_id = $1',
    [Number(studentID)],
  )
  if (student.rowCount === 0) {
    return response.status(404).json({ error: 'STUDENT_NOT_FOUND', message: 'Student not found.' })
  }
  const result = await pool.query(`
    INSERT INTO faculty_advising_notes (student_id, note)
    VALUES ($1, $2)
    RETURNING id, student_id, note, status, created_at
  `, [Number(studentID), note.trim()])
  const row = result.rows[0]
  response.status(201).json({
    id: row.id,
    studentID: String(row.student_id),
    student: `${student.rows[0].first_name} ${student.rows[0].last_name}`,
    note: row.note,
    status: row.status,
    createdAt: row.created_at,
  })
})

api.patch('/faculty/advising/:id', requireFaculty, async (request, response) => {
  await ensureFacultyTables()
  if (!/^[1-9]\d*$/.test(request.params.id)) {
    return response.status(400).json({ error: 'INVALID_ADVISING_ID' })
  }
  const status = request.body?.status
  if (!['open', 'completed'].includes(status)) {
    return response.status(400).json({ error: 'INVALID_ADVISING_STATUS' })
  }
  const result = await pool.query(`
    UPDATE faculty_advising_notes
    SET status = $1
    WHERE id = $2
    RETURNING id, student_id, note, status, created_at
  `, [status, Number(request.params.id)])
  if (result.rowCount === 0) {
    return response.status(404).json({ error: 'ADVISING_NOTE_NOT_FOUND' })
  }
  const row = result.rows[0]
  response.json({
    id: row.id,
    studentID: String(row.student_id),
    note: row.note,
    status: row.status,
    createdAt: row.created_at,
  })
})

// Faculty-only grading review workflow.
api.get('/faculty/grading', requireFaculty, async (_request, response) => {
  await ensureFacultyTables()
  const result = await pool.query(`
    SELECT g.id, g.student_id, s.first_name, s.last_name,
           g.course_code, g.grade, g.feedback, g.status, g.created_at
    FROM faculty_grading_submissions g
    LEFT JOIN students s ON s.student_id = g.student_id
    ORDER BY g.created_at DESC
  `)
  response.json(result.rows.map((row) => ({
    id: row.id,
    studentID: String(row.student_id),
    student: row.first_name ? `${row.first_name} ${row.last_name}` : `Student ${row.student_id}`,
    courseCode: row.course_code,
    grade: row.grade,
    feedback: row.feedback,
    status: row.status,
    createdAt: row.created_at,
  })))
})

api.post('/faculty/grading', requireFaculty, async (request, response) => {
  await ensureFacultyTables()
  const { studentID, courseCode, grade, feedback = '' } = request.body ?? {}
  if (typeof studentID !== 'string' || !/^\d{4}$/.test(studentID)
    || typeof courseCode !== 'string' || !courseCode.trim()
    || !Object.hasOwn(gradePoints, grade)
    || typeof feedback !== 'string') {
    return response.status(400).json({
      error: 'INVALID_GRADE_SUBMISSION',
      message: 'Provide a valid studentID, courseCode, letter grade, and feedback.',
    })
  }
  const student = await pool.query(
    'SELECT student_id, first_name, last_name FROM students WHERE student_id = $1',
    [Number(studentID)],
  )
  if (student.rowCount === 0) {
    return response.status(404).json({ error: 'STUDENT_NOT_FOUND', message: 'Student not found.' })
  }
  const result = await pool.query(`
    INSERT INTO faculty_grading_submissions
      (student_id, course_code, grade, feedback)
    VALUES ($1, $2, $3, $4)
    RETURNING id, student_id, course_code, grade, feedback, status, created_at
  `, [Number(studentID), courseCode.trim().toUpperCase(), grade, feedback.trim()])
  const row = result.rows[0]
  response.status(201).json({
    id: row.id,
    studentID: String(row.student_id),
    student: `${student.rows[0].first_name} ${student.rows[0].last_name}`,
    courseCode: row.course_code,
    grade: row.grade,
    feedback: row.feedback,
    status: row.status,
    createdAt: row.created_at,
  })
})

api.post('/faculty/login', async (request, response) => {
  const { username, password } = request.body ?? {}
  if (typeof username !== 'string' || typeof password !== 'string'
    || !username.trim() || password.length === 0) {
    return response.status(400).json({
      error: 'INVALID_CREDENTIALS',
      message: 'Enter a username and password.',
    })
  }

  try {
    await ensureFacultyAuthTables()
    const result = await pool.query(`
      SELECT id, password_salt, password_hash
      FROM faculty_accounts
      WHERE username = $1
    `, [username.trim().toLowerCase()])

    let authenticated = false
    let facultyId = null
    if (result.rowCount !== 0) {
      const account = result.rows[0]
      const suppliedHash = await hashPassword(password, account.password_salt)
      const storedHash = Buffer.from(account.password_hash, 'base64')
      const suppliedHashBuffer = Buffer.from(suppliedHash, 'base64')
      authenticated = suppliedHashBuffer.length === storedHash.length
        && crypto.timingSafeEqual(suppliedHashBuffer, storedHash)
      if (authenticated) facultyId = account.id
    }

    if (!authenticated) {
      return response.status(401).json({
        error: 'INVALID_CREDENTIALS',
        message: 'Incorrect faculty username or password.',
      })
    }

    await pool.query(
      'DELETE FROM faculty_sessions WHERE expires_at <= NOW() OR faculty_id = $1',
      [facultyId],
    )
    const token = crypto.randomBytes(32).toString('base64url')
    await pool.query(`
      INSERT INTO faculty_sessions (token_hash, faculty_id, expires_at)
      VALUES ($1, $2, NOW() + ($3 * INTERVAL '1 millisecond'))
    `, [sessionTokenHash(token), facultyId, SESSION_LIFETIME_MS])

    response.json({
      token,
      role: 'faculty',
      expiresIn: SESSION_LIFETIME_MS,
    })
  } catch (error) {
    console.error('Faculty login failed:', error)
    response.status(503).json({
      error: 'AUTH_SERVICE_UNAVAILABLE',
      message: 'Unable to authenticate faculty.',
    })
  }
})

api.post('/faculty/logout', requireFaculty, async (request, response) => {
  const authorization = request.get('Authorization')
  const token = authorization?.slice(7) || ''
  await pool.query('DELETE FROM faculty_sessions WHERE token_hash = $1', [sessionTokenHash(token)])
  response.json({ loggedOut: true })
})

api.get('/health', async (_request, response) => {
  try {
    const database = await checkDatabase()
    response.json({ status: 'ok', database: 'connected', timestamp: database.current_time })
  } catch (error) {
    console.error('Database health check failed:', error.message)
    response.status(503).json({
      status: 'error',
      database: 'disconnected',
      message: 'PostgreSQL is unavailable.',
    })
  }
})

app.use((error, _request, response, _next) => {
  console.error('API request failed:', error)
  if (response.headersSent) return
  response.status(500).json({
    error: 'INTERNAL_SERVER_ERROR',
    message: 'The request could not be completed.',
  })
})
