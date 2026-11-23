import express from 'express'
import { pool } from './db.js'
import { createAcademicData } from './academicData.js'

function invalid(message) {
  return Object.assign(new Error(message), { status: 400 })
}
function parseName(value) {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > 121) {
    throw invalid('Enter the student’s first and last name (up to 121 characters).')
  }
  return value.trim().replace(/\s+/g, ' ').toLowerCase()
}

function parseInstructorCode(value) {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > 4) {
    throw invalid('Enter a valid instructor code.')
  }
  return value.trim()
}

export function createAcademicRouter(database = pool) {
  const router = express.Router()
  const data = createAcademicData(database)
  router.use(express.json({ limit: '16kb' }))

  router.get('/status', async (_request, response) => {
    const students = await data.listStudents()
    response.json({ status: 'ok', service: 'Student database API', studentCount: students.length })
  })
  router.get('/students', async (request, response) => {
    const name = request.query.name === undefined ? undefined : parseName(request.query.name)
    response.json({ students: await data.listStudents(name) })
  })
  router.get('/courses', async (request, response) => {
    const name = request.query.name === undefined ? undefined : parseName(request.query.name)
    response.json({ courses: await data.listCourseInfo(name) })
  })
  router.post('/auth/instructor-code', async (request, response) => {
    const code = parseInstructorCode(request.body?.code)
    if (!await data.isInstructorCodeValid(code)) {
      return response.status(401).json({ error: 'ACCESS_DENIED', message: 'Access Denied' })
    }
    response.json({ valid: true })
  })
  router.get('/attendanceRecords', async (request, response) => {
    response.json({ attendanceRecords: await data.listAttendanceRecords() })
  })
  router.get('/attendanceRecords/:id', async (request, response) => {
    const id = request.params.id === undefined ? undefined : parseName(request.params.id)
    response.json({ attendanceRecord: await data.getAttendanceRecord(id) })
  })
  async function getTranscript(request, response) {
    let student
    if (request.query.name !== undefined && request.params.studentID === undefined) {
      if (request.query.studentID !== undefined) throw invalid('Search by name or student ID, not both.')
      const matches = await data.listStudents(parseName(request.query.name))
      if (matches.length > 1) return response.status(409).json({ error: 'AMBIGUOUS_NAME', message: 'More than one student has that name. Please clarify the student with your instructor.' })
      student = matches[0]
    } else {
      const id = request.params.studentID ?? request.query.studentID
      if (typeof id !== 'string' || !/^[1-9]\d*$/.test(id) || Number(id) > 2147483647) throw invalid('Provide a student’s first and last name or a positive student ID.')
      student = await data.getStudent(Number(id))
    }
    if (!student) return response.status(404).json({ error: 'STUDENT_NOT_FOUND', message: 'Student not found. Check the first and last name and try again.' })
    const transcript = await data.getTranscript(student)
    if (!transcript) return response.status(404).json({ error: 'TRANSCRIPT_NOT_FOUND', message: 'This student has no transcript courses in the database yet.' })
    response.json(transcript)
  }
  router.get('/transcripts', getTranscript)
  router.get('/transcripts/:studentID', getTranscript)
  router.use((error, _request, response, _next) => {
    if (error.status === 400) return response.status(400).json({ error: 'INVALID_INPUT', message: error.message })
    if (error.code === '42P01') {
      return response.status(503).json({
        error: 'TRANSCRIPT_SCHEMA_UNAVAILABLE',
        message: 'Transcript data is not configured in PostgreSQL. Set up the transcript tables before using this feature.',
      })
    }
    console.error('Academic database request failed:', error.code || error.name)
    response.status(503).json({ error: 'DATABASE_UNAVAILABLE', message: 'Student data is unavailable. Check PostgreSQL and run database setup.' })
  })
  return router
}