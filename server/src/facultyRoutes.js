import { Router } from 'express'
import { pool } from './db.js'
import { createFacultyAuth } from './facultyAuth.js'

const statuses = new Set(['present', 'absent', 'late', 'excused'])

function validDate(date) {
  if (typeof date !== 'string' || !/^20\d{2}-\d{2}-\d{2}$/.test(date)) return false
  const parsed = new Date(date)
  return Number.isFinite(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === date
}

function validEntries(entries) {
  if (!Array.isArray(entries) || entries.length < 1 || entries.length > 250) return false
  return entries.every((entry) =>
    Number.isInteger(entry?.studentId) && entry.studentId > 0 && entry.studentId <= 2147483647
      && statuses.has(entry.status),
  ) && new Set(entries.map((entry) => entry.studentId)).size === entries.length
}

function unavailableSection(res) {
  return res.status(404).json({ message: 'That section is unavailable to this account.' })
}

export function createFacultyRouter(db = pool) {
  const router = Router()
  const { signIn, signOut, authenticate, requireFaculty } = createFacultyAuth(db)
  router.use((_req, res, next) => {
    res.set('Cache-Control', 'no-store')
    next()
  })
  router.post('/session', signIn)
  router.delete('/session', authenticate, signOut)
  router.use(authenticate, requireFaculty)

  router.get('/sections', async (req, res) => {
    const { rows: sections } = await db.query(`
      SELECT s.id, s.title, s.meeting_days AS "meetingDays",
             to_char(s.starts_at, 'HH12:MI AM') AS "startsAt",
             to_char(s.ends_at, 'HH12:MI AM') AS "endsAt",
             s.location, COUNT(e.student_id)::int AS "studentCount"
      FROM faculty_dashboard.sections s
      LEFT JOIN faculty_dashboard.enrollments e ON e.section_id = s.id
      WHERE s.instructor_id = $1
      GROUP BY s.id ORDER BY s.meeting_days, s.starts_at, s.id
    `, [req.labSession.id])
    res.json({ sections })
  })

  router.get('/students', async (req, res) => {
    const search = typeof req.query.q === 'string' ? req.query.q.trim().replace(/\s+/g, ' ') : ''
    if (!search || search.length > 80) return res.status(400).json({ message: 'Enter a name or student ID.' })
    const { rows: students } = await db.query(`
      SELECT st.id, st.full_name AS "fullName", st.major, array_agg(s.id ORDER BY s.id) AS sections
      FROM faculty_dashboard.students st
      JOIN faculty_dashboard.enrollments e ON e.student_id = st.id
      JOIN faculty_dashboard.sections s ON s.id = e.section_id
      WHERE s.instructor_id = $1 AND
        (CASE WHEN $2 ~ '^[0-9]+$' THEN st.id::text = $2
              ELSE strpos(lower(st.full_name), lower($2)) > 0 END)
      GROUP BY st.id ORDER BY st.full_name, st.id LIMIT 50
    `, [req.labSession.id, search])
    res.json({ students })
  })

  router.get('/sections/:id/grades', async (req, res) => {
    const { rows: [section] } = await db.query(`
      SELECT s.id, ARRAY(
        SELECT json_build_object(
          'studentId', st.id, 'fullName', st.full_name,
          'gradedItems', count(g.item), 'earned', sum(g.earned), 'possible', sum(g.possible),
          'percentage', round(100 * sum(g.earned) / nullif(sum(g.possible), 0), 1)
        )
        FROM faculty_dashboard.enrollments e
        JOIN faculty_dashboard.students st ON st.id = e.student_id
        LEFT JOIN faculty_dashboard.scores g ON g.section_id = e.section_id AND g.student_id = e.student_id
        WHERE e.section_id = s.id
        GROUP BY st.id ORDER BY st.full_name, st.id
      ) AS grades
      FROM faculty_dashboard.sections s WHERE s.id = $1 AND s.instructor_id = $2
    `, [req.params.id, req.labSession.id])
    if (!section) return unavailableSection(res)
    res.json(section)
  })

  router.get('/sections/:id/attendance', async (req, res) => {
    if (!validDate(req.query.date)) return res.status(400).json({ message: 'Choose a valid meeting date.' })
    const { rows: [section] } = await db.query(`
      SELECT s.id, ARRAY(
        SELECT json_build_object('studentId', st.id, 'fullName', st.full_name, 'status', a.status)
        FROM faculty_dashboard.enrollments e
        JOIN faculty_dashboard.students st ON st.id = e.student_id
        LEFT JOIN faculty_dashboard.attendance a
          ON a.section_id = e.section_id AND a.student_id = e.student_id AND a.meeting_date = $3
        WHERE e.section_id = s.id ORDER BY st.full_name, st.id
      ) AS roster
      FROM faculty_dashboard.sections s WHERE s.id = $1 AND s.instructor_id = $2
    `, [req.params.id, req.labSession.id, req.query.date])
    if (!section) return unavailableSection(res)
    res.json(section)
  })

  router.put('/sections/:id/attendance', async (req, res) => {
    const { date, entries } = req.body ?? {}
    if (!validDate(date) || !validEntries(entries)) {
      return res.status(400).json({ message: 'Enter a valid date and one allowed status per selected student.' })
    }

    // Scope and roster checks are part of the write. Count before inserting so
    // a mixed batch containing one ineligible student saves none of the batch.
    const { rows: [result] } = await db.query(`
      WITH owned AS (
        SELECT id FROM faculty_dashboard.sections WHERE id = $1 AND instructor_id = $2
      ), incoming AS (
        SELECT "studentId", status FROM jsonb_to_recordset($4::jsonb) AS i("studentId" int, status text)
      ), eligible AS (
        SELECT e.section_id, e.student_id, i.status
        FROM owned
        JOIN faculty_dashboard.enrollments e ON e.section_id = owned.id
        JOIN incoming i ON i."studentId" = e.student_id
      ), saved AS (
        INSERT INTO faculty_dashboard.attendance (section_id, student_id, meeting_date, status)
        SELECT section_id, student_id, $3, status FROM eligible
        WHERE (SELECT count(*) FROM eligible) = (SELECT count(*) FROM incoming)
        ON CONFLICT (section_id, student_id, meeting_date) DO UPDATE SET status = EXCLUDED.status
        RETURNING student_id
      )
      SELECT EXISTS (SELECT 1 FROM owned) AS allowed, (SELECT count(*)::int FROM saved) AS saved
    `, [req.params.id, req.labSession.id, date, JSON.stringify(entries)])
    if (!result.allowed) return unavailableSection(res)
    if (!result.saved) return res.status(400).json({ message: 'Every student must be on the selected section roster.' })
    res.json({ date, saved: result.saved })
  })

  router.use((_req, res) => res.status(404).json({ message: 'Faculty endpoint not found.' }))
  return router
}

export function facultyErrorHandler(error, _req, res, next) {
  if (res.headersSent) return next(error)
  if (error.type === 'entity.parse.failed' || error.type === 'entity.too.large') {
    return res.status(error.status).json({ message: 'The request body could not be read.' })
  }
  console.error('Faculty API error:', error.code ?? error.message)
  res.status(503).json({ message: 'The faculty service is unavailable. Check the local database setup.' })
}
