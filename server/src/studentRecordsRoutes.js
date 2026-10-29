import express from 'express'
import { pool } from './db.js'
import { createStudentRecordsData } from './studentRecordsData.js'

function invalid(message) {
  return Object.assign(new Error(message), { status: 400, code: 'INVALID_INPUT' })
}

function parseId(value) {
  if (!/^[1-9]\d*$/.test(value) || Number(value) > 2147483647) throw invalid('Student ID must be a positive integer.')
  return Number(value)
}

function validateStudent(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw invalid('Provide a JSON student object.')
  const allowed = ['firstName', 'lastName', 'email', 'majorId', 'enrollmentYear', 'isActive']
  if (Object.keys(body).some((key) => !allowed.includes(key))) throw invalid('The request contains an unknown student field.')
  for (const field of ['firstName', 'lastName']) {
    if (typeof body[field] !== 'string' || !body[field].trim() || body[field].trim().length > 60) {
      throw invalid(`${field} must contain 1–60 characters.`)
    }
  }
  if (typeof body.email !== 'string' || body.email.trim().length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim())) {
    throw invalid('Provide a valid email address of at most 254 characters.')
  }
  if (!Number.isInteger(body.majorId) || body.majorId < 1 || body.majorId > 2147483647) throw invalid('Choose a valid major.')
  if (!Number.isInteger(body.enrollmentYear) || body.enrollmentYear < 2000 || body.enrollmentYear > 2100) {
    throw invalid('Enrollment year must be an integer from 2000 through 2100.')
  }
  if (typeof body.isActive !== 'boolean') throw invalid('isActive must be true or false.')
  return { ...body, firstName: body.firstName.trim(), lastName: body.lastName.trim(), email: body.email.trim().toLowerCase() }
}

export function createStudentRecordsRouter(database = pool) {
  const router = express.Router()
  const data = createStudentRecordsData(database)
  router.use(express.json({ limit: '16kb' }))

  router.get('/majors', async (_request, response) => {
    response.json({ majors: await data.listMajors() })
  })
  router.get('/students', async (_request, response) => {
    response.json({ students: await data.listStudents() })
  })
  router.get('/students/:id', async (request, response) => {
    const student = await data.getStudent(parseId(request.params.id))
    if (!student) return response.status(404).json({ error: 'NOT_FOUND', message: 'Student not found.' })
    response.json({ student })
  })
  router.post('/students', async (request, response) => {
    const student = await data.createStudent(validateStudent(request.body))
    response.location(`${request.baseUrl}/students/${student.id}`).status(201).json({ student })
  })
  router.put('/students/:id', async (request, response) => {
    const student = await data.updateStudent(parseId(request.params.id), validateStudent(request.body))
    if (!student) return response.status(404).json({ error: 'NOT_FOUND', message: 'Student not found.' })
    response.json({ student })
  })
  router.delete('/students/:id', async (request, response) => {
    if (!await data.deleteStudent(parseId(request.params.id))) {
      return response.status(404).json({ error: 'NOT_FOUND', message: 'Student not found.' })
    }
    response.status(204).end()
  })

  // Express 5 forwards rejected async handlers here. Never expose SQL or secrets.
  router.use((error, _request, response, _next) => {
    if ((error.code === '23503' || error.code === '23001') && error.table === 'transcript_courses') {
      return response.status(409).json({ error: 'STUDENT_HAS_TRANSCRIPT', message: 'This student has transcript courses and cannot be deleted.' })
    }
    if (error.code === '23505') return response.status(409).json({ error: 'EMAIL_EXISTS', message: 'A student with that email already exists.' })
    if (error.code === '23503' || error.code === '23001') return response.status(409).json({ error: 'INVALID_MAJOR', message: 'That major is unavailable. Refresh the major list.' })
    if (error.code === '23514' || error.code === '23502' || error.code === '22001') return response.status(400).json({ error: 'INVALID_INPUT', message: 'Student values violate a database constraint.' })
    if (error.type === 'entity.parse.failed') return response.status(400).json({ error: 'INVALID_JSON', message: 'Provide valid JSON.' })
    if (error.type === 'entity.too.large') return response.status(413).json({ error: 'BODY_TOO_LARGE', message: 'Request body exceeds 16 KB.' })
    if (error.status === 400) return response.status(400).json({ error: error.code, message: error.message })
    console.error('Student records database request failed:', error.code || error.name)
    response.status(503).json({ error: 'DATABASE_UNAVAILABLE', message: 'Student records are unavailable. Check PostgreSQL and run database setup.' })
  })
  return router
}
