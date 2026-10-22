import cors from 'cors'
import express from 'express'
import { pool } from './db.js'
import { ApiError, resources, studentID, recordID, validateBody, selectFields, requireStudent, listRecords, transcriptFor } from './dashboardData.js'

export function createApp(database = pool) {
  const app = express()
  const origins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173,http://127.0.0.1:5173').split(',')
  app.use(cors({ origin: origins, methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'] }))
  app.use(express.json({ limit: '32kb' }))
  app.get('/', (_req, res) => res.json({ message: 'CSC 425 API', description: 'Local classroom PostgreSQL dashboard with fictional records.' }))
  app.get(['/api/health', '/api/status'], async (_req, res) => {
    try {
      const result = await database.query('SELECT count(*)::int AS count FROM student_dashboard.students')
      res.json({ status: 'ok', database: 'connected', service: 'Student dashboard API', studentCount: result.rows[0].count })
    } catch {
      res.status(503).json({ status: 'error', database: 'unavailable', message: 'Database unavailable. Check the connection and run npm run db:setup --prefix server.' })
    }
  })
  app.get(['/api/transcripts', '/api/transcripts/:studentID'], async (req, res) => {
    const id = studentID(req.params.studentID ?? req.query.studentID)
    // One transaction gives names, grades, and totals a consistent snapshot.
    const client = await database.connect()
    try {
      await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY')
      const student = await requireStudent(client, id)
      const rows = await listRecords(client, 'enrollments', id)
      await client.query('COMMIT')
      res.json(transcriptFor(student, rows))
    } catch (error) { await client.query('ROLLBACK'); throw error }
    finally { client.release() }
  })

  for (const [name, resource] of Object.entries(resources)) {
    const path = resource.scoped ? `/api/students/:studentID/${name}` : `/api/${name}`
    const router = express.Router({ mergeParams: true })
    router.use(async (req, _res, next) => {
      if (resource.scoped) {
        req.dashboardStudentID = studentID(req.params.studentID)
        await requireStudent(database, req.dashboardStudentID)
      }
      next()
    })
    router.get('/', async (req, res) => {
      const rows = await listRecords(database, name, req.dashboardStudentID)
      res.json(name === 'students' ? { students: rows } : { records: rows })
    })
    router.get('/:id', async (req, res) => {
      const id = resource.key === 'student_id' ? studentID(req.params.id) : recordID(req.params.id)
      const rows = await listRecords(database, name, req.dashboardStudentID)
      const record = rows.find((row) => (row.id ?? row.studentID) === id)
      if (!record) throw new ApiError(404, 'RECORD_NOT_FOUND', 'Record not found for this student or resource.')
      res.json({ record })
    })
    async function save(req, res) {
      const updating = req.method === 'PUT'
      const body = validateBody(name, req.body, updating)
      const keys = Object.keys(body)
      const values = Object.values(body)
      const columns = keys.map((key) => resource.fields[key])
      if (resource.scoped && name !== 'attendance') { columns.push('student_id'); values.push(req.dashboardStudentID) }
      // Attendance ownership is checked in the write statement, not just in React.
      if (name === 'attendance') {
        const owned = await database.query('SELECT id FROM student_dashboard.enrollments WHERE id=$1 AND student_id=$2', [body.enrollmentID, req.dashboardStudentID])
        if (!owned.rowCount) throw new ApiError(400, 'INVALID_ENROLLMENT', 'Choose an enrollment belonging to this student.')
      }
      let result
      if (updating) {
        const id = resource.key === 'student_id' ? studentID(req.params.id) : recordID(req.params.id)
        values.push(id)
        let where = `${resource.key}=$${values.length}`
        if (resource.scoped) {
          values.push(req.dashboardStudentID)
          where += name === 'attendance'
            ? ` AND enrollment_id IN (SELECT id FROM student_dashboard.enrollments WHERE student_id=$${values.length})`
            : ` AND student_id=$${values.length}`
        }
        result = await database.query(`UPDATE student_dashboard.${resource.table} SET ${columns.map((column, i) => `${column}=$${i + 1}`).join(', ')} WHERE ${where} RETURNING ${selectFields(resource)}`, values)
        if (!result.rowCount) throw new ApiError(404, 'RECORD_NOT_FOUND', 'Record not found for this student or resource.')
      } else {
        result = await database.query(`INSERT INTO student_dashboard.${resource.table} (${columns.join(', ')}) VALUES (${values.map((_, i) => `$${i + 1}`).join(', ')}) RETURNING ${selectFields(resource)}`, values)
      }
      res.status(updating ? 200 : 201).json({ record: result.rows[0] })
    }
    router.post('/', save)
    router.put('/:id', save)
    router.delete('/:id', async (req, res) => {
      const id = resource.key === 'student_id' ? studentID(req.params.id) : recordID(req.params.id)
      const values = [id]
      let where = `${resource.key}=$1`
      if (resource.scoped) {
        values.push(req.dashboardStudentID)
        where += name === 'attendance' ? ' AND enrollment_id IN (SELECT id FROM student_dashboard.enrollments WHERE student_id=$2)' : ' AND student_id=$2'
      }
      const result = await database.query(`DELETE FROM student_dashboard.${resource.table} WHERE ${where}`, values)
      if (!result.rowCount) throw new ApiError(404, 'RECORD_NOT_FOUND', 'Record not found for this student or resource.')
      res.status(204).end()
    })
    app.use(path, router)
  }
  app.use('/api', (_req, res) => res.status(404).json({ error: 'NOT_FOUND', message: 'API endpoint not found.' }))
  app.use((error, _req, res, _next) => {
    if (error instanceof ApiError) return res.status(error.status).json({ error: error.code, message: error.message })
    if (error.type === 'entity.parse.failed') return res.status(400).json({ error: 'INVALID_JSON', message: 'Send valid JSON.' })
    if (error.type === 'entity.too.large') return res.status(413).json({ error: 'REQUEST_TOO_LARGE', message: 'Request body is too large.' })
    if (error.code === '23505') return res.status(409).json({ error: 'DUPLICATE_RECORD', message: 'That student ID, course code, registration, or attendance date already exists.' })
    if (['23503', '23001'].includes(error.code)) return res.status(409).json({ error: 'RELATED_RECORD', message: 'A related record is missing or still in use. Remove its registrations before deleting a course.' })
    if (['23514', '23502', '22007', '22008', '22P02'].includes(error.code)) return res.status(400).json({ error: 'INVALID_INPUT', message: 'Check the submitted values.' })
    console.error('Dashboard request failed:', error.code || error.name)
    res.status(503).json({ error: 'DATABASE_UNAVAILABLE', message: 'Unable to access the database. Check the server connection and database setup, then retry.' })
  })
  return app
}
export const app = createApp()
