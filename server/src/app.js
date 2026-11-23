import 'dotenv/config'
import { readFileSync, writeFileSync } from 'node:fs'
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

// The earlier transcript exercise keeps its course/grade fixtures in JSON.
// It also works without a database. /api/students uses only the array above.
const transcriptsFile = new URL('./data/transcripts.json', import.meta.url)
const { students: transcripts } = JSON.parse(readFileSync(transcriptsFile, 'utf8'))
const gradePoints = { A: 4, B: 3, C: 2, D: 1, F: 0 }

// Only the fictional API allows requests from any frontend origin.
const teachingApi = express.Router()
teachingApi.use(['/status', '/students', '/rosters'], cors({ methods: ['GET', 'HEAD', 'OPTIONS'] }))
teachingApi.use('/transcripts', cors({ methods: ['GET', 'HEAD', 'OPTIONS', 'PATCH'] }))
teachingApi.use(express.json())

teachingApi.get('/status', (_request, response) => {
  response.json({ status: 'ok', service: 'Mock transcript API', studentCount: mockStudents.length })
})

teachingApi.get('/students', (_request, response) => {
  // Express converts the JavaScript object to JSON for the React frontend.
  // StudentLookup selects the matching full name from this returned array.
  response.json({ students: mockStudents })
})

function getCourseRoster(request, response) {
  const requestedCode = request.params.courseCode
  if (typeof requestedCode !== 'string' || !/^[A-Z]{3}\s+\d{3}$/i.test(requestedCode.trim())) {
    return response.status(400).json({
      error: 'INVALID_COURSE_CODE',
      message: 'Provide a course code such as CSC 101.',
    })
  }

  const courseCode = requestedCode.trim().replace(/\s+/g, ' ').toUpperCase()
  const students = []
  let courseTitle = ''

  for (const student of transcripts) {
    for (const semester of student.semesters) {
      for (const course of semester.courses) {
        if (course.courseCode.toUpperCase() !== courseCode) continue
        courseTitle = courseTitle || course.courseTitle
        students.push({
          studentID: student.studentID,
          firstName: student.firstName,
          lastName: student.lastName,
          term: semester.term,
          grade: course.grade,
          termGPA: semester.gpa,
          cumulativeGPA: student.summary.cumulativeGPA,
        })
      }
    }
  }

  if (students.length === 0) {
    return response.status(404).json({
      error: 'COURSE_NOT_FOUND',
      message: `No mock course was found with course code ${courseCode}.`,
    })
  }

  return response.json({ courseCode, courseTitle, students })
}

teachingApi.get('/rosters/:courseCode', getCourseRoster)

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

function recalculateTranscript(transcript) {
  let totalAttempted = 0
  let totalEarned = 0
  let totalQuality = 0

  for (const semester of transcript.semesters) {
    let attempted = 0
    let earned = 0
    let quality = 0

    for (const course of semester.courses) {
      attempted += course.creditHours
      if (course.grade !== 'F') earned += course.creditHours
      quality += course.creditHours * gradePoints[course.grade]
    }

    semester.creditsAttempted = attempted
    semester.creditsEarned = earned
    semester.gpa = Number((attempted ? quality / attempted : 0).toFixed(2))
    totalAttempted += attempted
    totalEarned += earned
    totalQuality += quality
  }

  transcript.summary = {
    creditsAttempted: totalAttempted,
    creditsEarned: totalEarned,
    cumulativeGPA: Number((totalAttempted ? totalQuality / totalAttempted : 0).toFixed(2)),
  }
}

function updateTranscriptGrade(request, response) {
  const { studentID } = request.params
  if (!/^\d{4}$/.test(studentID)) {
    return response.status(400).json({
      error: 'INVALID_STUDENT_ID',
      message: 'Provide a four-digit studentID.',
    })
  }

  const body = request.body
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return response.status(400).json({
      error: 'INVALID_GRADE_UPDATE',
      message: 'Provide courseCode, term, and grade in the request body.',
    })
  }

  const { courseCode, term, grade } = body
  if (
    typeof courseCode !== 'string'
    || !/^[A-Z]{3}\s+\d{3}$/i.test(courseCode.trim())
    || typeof term !== 'string'
    || !term.trim()
    || typeof grade !== 'string'
    || !Object.hasOwn(gradePoints, grade.trim().toUpperCase())
  ) {
    return response.status(400).json({
      error: 'INVALID_GRADE_UPDATE',
      message: 'Provide a valid courseCode, term, and grade from A, B, C, D, or F.',
    })
  }

  const normalizedCourseCode = courseCode.trim().replace(/\s+/g, ' ').toUpperCase()
  const normalizedTerm = term.trim()
  const normalizedGrade = grade.trim().toUpperCase()
  const studentIndex = transcripts.findIndex((student) => student.studentID === studentID)
  if (studentIndex === -1) {
    return response.status(404).json({
      error: 'STUDENT_NOT_FOUND',
      message: `No mock student was found with studentID ${studentID}.`,
    })
  }

  const currentTranscript = transcripts[studentIndex]
  const updatedTranscript = {
    ...currentTranscript,
    semesters: currentTranscript.semesters.map((semester) => ({
      ...semester,
      courses: semester.courses.map((course) => ({ ...course })),
    })),
    summary: { ...currentTranscript.summary },
  }
  const semester = updatedTranscript.semesters.find((item) => item.term === normalizedTerm)
  if (!semester) {
    return response.status(404).json({
      error: 'TERM_NOT_FOUND',
      message: `No term was found with name ${normalizedTerm}.`,
    })
  }

  const course = semester.courses.find((item) => item.courseCode.toUpperCase() === normalizedCourseCode)
  if (!course) {
    return response.status(404).json({
      error: 'COURSE_NOT_FOUND',
      message: `No course was found with courseCode ${normalizedCourseCode} in ${normalizedTerm}.`,
    })
  }

  course.grade = normalizedGrade
  recalculateTranscript(updatedTranscript)

  const updatedTranscripts = transcripts.slice()
  updatedTranscripts[studentIndex] = updatedTranscript
  try {
    writeFileSync(transcriptsFile, `${JSON.stringify({ students: updatedTranscripts }, null, 2)}\n`, 'utf8')
  } catch (error) {
    console.error('Failed to persist mock transcript grade update:', error)
    return response.status(500).json({
      error: 'TRANSCRIPT_SAVE_FAILED',
      message: 'Unable to save the updated transcript.',
    })
  }

  transcripts[studentIndex] = updatedTranscript
  return response.json(updatedTranscript)
}

teachingApi.patch('/transcripts/:studentID/grades', updateTranscriptGrade)



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
