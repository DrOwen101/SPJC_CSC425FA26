import { Router } from 'express'
import { pool } from './db.js'

const departments = ['CSC', 'MAT', 'GEN']
const days = ['Mon / Wed', 'Tue / Thu', 'Friday']
const sectionId = /^[A-Z]{2,5}[0-9]{2,4}-[0-9]{2}$/
const time = /^([01][0-9]|2[0-3]):[0-5][0-9]$/

function text(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function validInstructor(id) {
  return Number.isInteger(id) && id > 0 && id <= 2147483647
}

export function createAdminRouter(auth, db = pool) {
  const router = Router()
  router.use((_req, res, next) => {
    res.set('Cache-Control', 'no-store')
    next()
  })
  router.post('/session', auth.signIn)
  router.delete('/session', auth.authenticate, auth.signOut)
  router.use(auth.authenticate, (req, res, next) => {
    if (req.labSession.role !== 'admin') {
      return res.status(403).json({ message: 'An administrator account is required.' })
    }
    next()
  })

  router.get('/instructors', async (_req, res) => {
    const { rows: instructors } = await db.query(`
      SELECT id, display_name AS name FROM faculty_dashboard.accounts
      WHERE role = 'faculty' ORDER BY display_name, id
    `)
    res.json({ instructors })
  })

  router.get('/sections', async (req, res) => {
    const department = req.query.department
    if (department !== undefined && !departments.includes(department)) {
      return res.status(400).json({ message: 'Choose a valid department.' })
    }
    const { rows: sections } = await db.query(`
      SELECT s.id, s.title, s.department, a.display_name AS instructor,
             s.meeting_days AS "meetingDays",
             to_char(s.starts_at, 'HH12:MI AM') AS "startsAt",
             to_char(s.ends_at, 'HH12:MI AM') AS "endsAt",
             s.location, count(e.student_id)::int AS "studentCount"
      FROM faculty_dashboard.sections s
      JOIN faculty_dashboard.accounts a ON a.id = s.instructor_id
      LEFT JOIN faculty_dashboard.enrollments e ON e.section_id = s.id
      WHERE ($1::text IS NULL OR s.department = $1)
      GROUP BY s.id, a.display_name ORDER BY s.id
    `, [department ?? null])
    res.json({ sections })
  })

  router.post('/sections', async (req, res) => {
    const input = req.body ?? {}
    const id = text(input.id).toUpperCase()
    const title = text(input.title)
    const location = text(input.location)
    const { startsAt, endsAt, department, meetingDays, instructorId } = input
    if (!sectionId.test(id) || !title || title.length > 100 || !location || location.length > 80
      || !departments.includes(department) || !days.includes(meetingDays) || !validInstructor(instructorId)
      || typeof startsAt !== 'string' || typeof endsAt !== 'string'
      || !time.test(startsAt) || !time.test(endsAt) || startsAt >= endsAt) {
      return res.status(400).json({ message: 'Complete all fields. Use a section ID like CSC130-01 and an end time after the start.' })
    }

    try {
      const { rows: [section] } = await db.query(`
        INSERT INTO faculty_dashboard.sections
          (id, title, department, meeting_days, starts_at, ends_at, location, instructor_id)
        SELECT $1, $2, $3, $4, $5, $6, $7, a.id
        FROM faculty_dashboard.accounts a WHERE a.id = $8 AND a.role = 'faculty'
        RETURNING id
      `, [id, title, department, meetingDays, startsAt, endsAt, location, instructorId])
      if (!section) return res.status(400).json({ message: 'Choose a faculty instructor.' })
      return res.status(201).json({ section })
    } catch (error) {
      if (error.code === '23505') return res.status(409).json({ message: 'That section ID already exists.' })
      throw error
    }
  })

  router.patch('/sections/:id/instructor', async (req, res) => {
    const { id } = req.params
    const instructorId = req.body?.instructorId
    if (!sectionId.test(id) || !validInstructor(instructorId)) {
      return res.status(400).json({ message: 'Choose a valid section and instructor.' })
    }
    const { rows: [result] } = await db.query(`
      WITH updated AS (
        UPDATE faculty_dashboard.sections s SET instructor_id = a.id
        FROM faculty_dashboard.accounts a
        WHERE s.id = $1 AND a.id = $2 AND a.role = 'faculty'
        RETURNING s.id, a.display_name AS instructor
      )
      SELECT EXISTS (SELECT 1 FROM faculty_dashboard.sections WHERE id = $1) AS found,
             (SELECT row_to_json(updated) FROM updated) AS section
    `, [id, instructorId])
    if (!result.found) return res.status(404).json({ message: 'That section was not found.' })
    if (!result.section) return res.status(400).json({ message: 'Choose a faculty instructor.' })
    res.json({ section: result.section })
  })

  // Adapt the faculty roster query to review absences across class dates.
  router.get('/attendance-concerns', async (req, res) => {
    const department = req.query.department
    if (department !== undefined && !departments.includes(department)) {
      return res.status(400).json({ message: 'Choose a valid department.' })
    }
    const { rows: concerns } = await db.query(`
      SELECT st.id AS "studentId", st.full_name AS "fullName",
             s.id AS "sectionId", count(*)::int AS absences,
             max(a.meeting_date)::text AS "lastAbsence"
      FROM faculty_dashboard.attendance a
      JOIN faculty_dashboard.students st ON st.id = a.student_id
      JOIN faculty_dashboard.sections s ON s.id = a.section_id
      WHERE a.status = 'absent' AND ($1::text IS NULL OR s.department = $1)
      GROUP BY st.id, s.id HAVING count(*) >= 2
      ORDER BY absences DESC, s.id, st.full_name, st.id
    `, [department ?? null])
    res.json({ concerns })
  })

  router.use((_req, res) => res.status(404).json({ message: 'Admin endpoint not found.' }))
  return router
}

export function adminErrorHandler(error, _req, res, next) {
  if (res.headersSent) return next(error)
  if (error.type === 'entity.parse.failed' || error.type === 'entity.too.large') {
    return res.status(error.status).json({ message: 'The request body could not be read.' })
  }
  console.error('Admin API error:', error.code ?? error.message)
  res.status(503).json({ message: 'The admin service is unavailable. Check the local database setup.' })
}
