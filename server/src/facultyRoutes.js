import express from 'express'
import { pool } from './db.js'
import { requireAuth, requireRole } from './auth.js'

// Lab 12: faculty-only routes. Every request must come from a signed-in
// faculty account, and every query is limited to that faculty member's own
// sections, so changing an id in the URL cannot reach another class.
export const facultyRouter = express.Router()
facultyRouter.use(requireAuth, requireRole('faculty'))

const GRADES = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'F']

function badRequest(message) {
  return Object.assign(new Error(message), { status: 400 })
}

function parseId(value, label) {
  if (!/^[1-9][0-9]{0,8}$/.test(value)) throw badRequest(`The ${label} id must be a positive whole number.`)
  return Number(value)
}

// Returns true only if this section belongs to the signed-in faculty member.
async function ownsSection(sectionId, facultyId) {
  const result = await pool.query(
    'SELECT 1 FROM student_dashboard.course_sections WHERE id = $1 AND instructor_id = $2',
    [sectionId, facultyId],
  )
  return result.rowCount === 1
}

// 404 (not 403) so the response does not reveal whether another teacher's section exists.
const sectionNotFound = (response, id) =>
  response.status(404).json({ error: `No section with id ${id} is assigned to you.` })

// GET /api/faculty/sections → the signed-in faculty member's sections
facultyRouter.get('/sections', async (request, response, next) => {
  try {
    const result = await pool.query(`
      SELECT cs.id, c.course_code AS "courseCode", c.title, cs.section_number AS "sectionNumber",
             cs.term_code AS "termCode", count(e.id)::int AS "studentCount",
             count(e.final_grade)::int AS "gradedCount"
      FROM student_dashboard.course_sections cs
      JOIN student_dashboard.courses c ON c.id = cs.course_id
      LEFT JOIN student_dashboard.enrollments e ON e.section_id = cs.id
      WHERE cs.instructor_id = $1
      GROUP BY cs.id, c.course_code, c.title
      ORDER BY c.course_code, cs.section_number`, [request.user.facultyId])
    response.json({ sections: result.rows })
  } catch (error) {
    next(error)
  }
})

// GET /api/faculty/sections/:sectionId/roster → students in one of your sections
facultyRouter.get('/sections/:sectionId/roster', async (request, response, next) => {
  try {
    const sectionId = parseId(request.params.sectionId, 'section')
    if (!(await ownsSection(sectionId, request.user.facultyId))) return sectionNotFound(response, sectionId)
    const result = await pool.query(`
      SELECT e.id AS "enrollmentId", s.id AS "studentId", s.first_name AS "firstName",
             s.last_name AS "lastName", s.email, m.name AS "majorName",
             e.final_grade AS "finalGrade", e.grade_posted_at AS "gradePostedAt"
      FROM student_dashboard.enrollments e
      JOIN student_dashboard.students s ON s.id = e.student_id
      JOIN student_dashboard.majors m ON m.id = s.major_id
      WHERE e.section_id = $1
      ORDER BY s.last_name, s.first_name`, [sectionId])
    response.json({ roster: result.rows })
  } catch (error) {
    next(error)
  }
})

// PUT /api/faculty/sections/:sectionId/enrollments/:enrollmentId/grade  { finalGrade }
// Posts, changes, or clears (null) one student's final grade in one of your sections.
facultyRouter.put('/sections/:sectionId/enrollments/:enrollmentId/grade', async (request, response, next) => {
  try {
    const sectionId = parseId(request.params.sectionId, 'section')
    const enrollmentId = parseId(request.params.enrollmentId, 'enrollment')
    const finalGrade = request.body?.finalGrade
    if (finalGrade !== null && !GRADES.includes(finalGrade)) {
      throw badRequest(`finalGrade must be one of ${GRADES.join(', ')}, or null to clear it.`)
    }

    // The WHERE checks the enrollment id, the section id, AND that the section is
    // taught by the signed-in faculty member, so only that one row can change.
    const result = await pool.query(`
      UPDATE student_dashboard.enrollments e
      SET final_grade = $1::varchar,
          grade_posted_at = CASE WHEN $1::varchar IS NULL THEN NULL ELSE clock_timestamp() END,
          grade_posted_by = CASE WHEN $1::varchar IS NULL THEN NULL ELSE $4::int END
      FROM student_dashboard.course_sections cs
      WHERE e.id = $2 AND e.section_id = $3 AND cs.id = e.section_id AND cs.instructor_id = $4
      RETURNING e.id AS "enrollmentId", e.final_grade AS "finalGrade", e.grade_posted_at AS "gradePostedAt"`,
    [finalGrade, enrollmentId, sectionId, request.user.facultyId])
    if (result.rowCount === 0) {
      return response.status(404).json({ error: `No enrollment ${enrollmentId} in a section assigned to you.` })
    }
    response.json({ enrollment: result.rows[0] })
  } catch (error) {
    next(error)
  }
})

// GET /api/faculty/students/search?q=text → students in YOUR sections whose
// name or email contains the text. Repurposed from the student Student lookup.
facultyRouter.get('/students/search', async (request, response, next) => {
  try {
    const query = String(request.query.q ?? '').trim().toLowerCase().replace(/\s+/g, ' ')
    if (query.length < 2 || query.length > 60) throw badRequest('Enter 2 to 60 characters to search.')
    // Escape LIKE wildcards so "%" or "_" are searched as plain text.
    const pattern = `%${query.replace(/[\\%_]/g, '\\$&')}%`
    const result = await pool.query(`
      SELECT s.id AS "studentId", s.first_name AS "firstName", s.last_name AS "lastName",
             s.email, m.name AS "majorName",
             array_agg(c.course_code || '-' || cs.section_number ORDER BY c.course_code) AS sections
      FROM student_dashboard.students s
      JOIN student_dashboard.majors m ON m.id = s.major_id
      JOIN student_dashboard.enrollments e ON e.student_id = s.id
      JOIN student_dashboard.course_sections cs ON cs.id = e.section_id
      JOIN student_dashboard.courses c ON c.id = cs.course_id
      WHERE cs.instructor_id = $1
        AND (lower(s.first_name || ' ' || s.last_name) LIKE $2 OR lower(s.email) LIKE $2)
      GROUP BY s.id, m.name
      ORDER BY s.last_name, s.first_name
      LIMIT 25`, [request.user.facultyId, pattern])
    response.json({ students: result.rows })
  } catch (error) {
    next(error)
  }
})

// Clear status codes for every failure. SQL and passwords never reach the browser.
// eslint-disable-next-line no-unused-vars
facultyRouter.use((error, _request, response, _next) => {
  if (error.status === 400) return response.status(400).json({ error: error.message })
  if (['23514', '22P02', '22001'].includes(error.code)) {
    return response.status(400).json({ error: 'One of the values is not allowed by the database.' })
  }
  console.error('Faculty request failed:', error.code || error.name, error.message)
  response.status(503).json({ error: 'The database is unavailable. Nothing was saved. Please try again.' })
})
