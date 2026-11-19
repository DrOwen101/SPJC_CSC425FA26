import { createHash, randomBytes } from 'node:crypto'
import express from 'express'
import { pool } from './db.js'

const GRADES = ['A', 'B', 'C', 'D', 'F']
const STATUSES = ['present', 'absent', 'late', 'excused']

class ApiError extends Error {
    constructor(status, apiCode, message) {
        super(message)
        this.status = status
        this.apiCode = apiCode
    }
}

// Sends async errors to the error handler
const handle = (fn) => (request, response, next) =>
    Promise.resolve(fn(request, response, next)).catch(next)

const hashToken = (token) => createHash('sha256').update(token).digest('hex')

function parseId(value) {
    if (!/^[1-9]\d*$/.test(value) || Number(value) > 2147483647) {
        throw new ApiError(400, 'INVALID_ID', 'ID must be a positive whole number.')
    }
    return Number(value)
}

function parseDate(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        throw new ApiError(400, 'INVALID_DATE', 'Provide a date as YYYY-MM-DD.')
    }
    return value
}

//every faculty route runs this first
const requireFaculty = handle(async (request, _response, next) => {
    const header = request.get('authorization') ?? ''
    const token = header.startsWith('Bearer ') ? header.slice(7).trim() : ''
    if (token) {
        const tokenHash = hashToken(token)
        const { rows } = await pool.query(
            `SELECT f.id, f.first_name AS "firstName", f.last_name AS "lastName", f.email
       FROM student_dashboard.faculty_sessions s
       JOIN student_dashboard.faculty f ON f.id = s.faculty_id
       WHERE s.token_hash = $1 AND s.expires_at > now() AND f.is_active`,
            [tokenHash],
        )
        if (rows[0]) {
            request.faculty = rows[0]
            request.tokenHash = tokenHash
            return next()
        }
    }
    throw new ApiError(401, 'UNAUTHENTICATED', 'Sign in as faculty to continue.')
})

//a faculty member can only touch sections they teach.
async function ownSection(request) {
    const sectionId = parseId(request.params.sectionId)
    const { rows } = await pool.query(
        'SELECT faculty_id FROM student_dashboard.course_sections WHERE id = $1', [sectionId])
    if (!rows[0]) throw new ApiError(404, 'NOT_FOUND', 'Section not found.')
    if (rows[0].faculty_id !== request.faculty.id) {
        throw new ApiError(403, 'FORBIDDEN', 'You do not teach this section.')
    }
    return sectionId
}

async function ownEnrollment(request) {
    const enrollmentId = parseId(request.params.enrollmentId)
    const { rows } = await pool.query(
        `SELECT cs.faculty_id
     FROM student_dashboard.enrollments e
     JOIN student_dashboard.course_sections cs ON cs.id = e.section_id
     WHERE e.id = $1`,
        [enrollmentId],
    )
    if (!rows[0]) throw new ApiError(404, 'NOT_FOUND', 'Enrollment not found.')
    if (rows[0].faculty_id !== request.faculty.id) {
        throw new ApiError(403, 'FORBIDDEN', 'You do not teach the section for this enrollment.')
    }
    return enrollmentId
}

export const facultyRouter = express.Router()
facultyRouter.use(express.json({ limit: '16kb' }))

facultyRouter.post('/login', handle(async (request, response) => {
    const { email, passcode } = request.body ?? {}
    if (typeof email !== 'string' || typeof passcode !== 'string' || !email.trim() || !passcode) {
        throw new ApiError(400, 'INVALID_INPUT', 'Enter your email and passcode.')
    }
    // The passcode is checked inside PostgreSQL against the stored hash.
    const { rows } = await pool.query(
        `SELECT id, first_name AS "firstName", last_name AS "lastName", email
     FROM student_dashboard.faculty
     WHERE email = $1 AND is_active AND password_hash = crypt($2, password_hash)`,
        [email.trim().toLowerCase(), passcode],
    )
    if (!rows[0]) throw new ApiError(401, 'INVALID_LOGIN', 'Email or passcode is incorrect.')

    const token = randomBytes(32).toString('hex')
    await pool.query('DELETE FROM student_dashboard.faculty_sessions WHERE expires_at < now()')
    await pool.query(
        `INSERT INTO student_dashboard.faculty_sessions (token_hash, faculty_id, expires_at)
     VALUES ($1, $2, now() + interval '8 hours')`,
        [hashToken(token), rows[0].id],
    )
    response.json({ token, faculty: rows[0] })
}))

facultyRouter.post('/logout', requireFaculty, handle(async (request, response) => {
    await pool.query('DELETE FROM student_dashboard.faculty_sessions WHERE token_hash = $1', [request.tokenHash])
    response.status(204).end()
}))

//Repurposed: teaching assignments
facultyRouter.get('/sections', requireFaculty, handle(async (request, response) => {
    const { rows } = await pool.query(
        `SELECT cs.id, c.code AS "courseCode", c.title AS "courseTitle", cs.term,
            cs.section_number AS "sectionNumber", c.credit_hours AS "creditHours",
            (SELECT count(*)::int FROM student_dashboard.enrollments e
              WHERE e.section_id = cs.id) AS "enrolledCount"
     FROM student_dashboard.course_sections cs
     JOIN student_dashboard.courses c ON c.id = cs.course_id
     WHERE cs.faculty_id = $1
     ORDER BY cs.term DESC, c.code`,
        [request.faculty.id],
    )
    response.json({ sections: rows })
}))

// Repurposed: class roster
facultyRouter.get('/sections/:sectionId/roster', requireFaculty, handle(async (request, response) => {
    const sectionId = await ownSection(request)
    const { rows } = await pool.query(
        `SELECT e.id AS "enrollmentId", s.id AS "studentId",
            s.first_name AS "firstName", s.last_name AS "lastName", s.email,
            m.name AS "majorName", e.final_grade AS "finalGrade",
            (SELECT count(*)::int FROM student_dashboard.attendance_records a
              WHERE a.enrollment_id = e.id AND a.status = 'absent') AS absences
     FROM student_dashboard.enrollments e
     JOIN student_dashboard.students s ON s.id = e.student_id
     JOIN student_dashboard.majors m ON m.id = s.major_id
     WHERE e.section_id = $1
     ORDER BY s.last_name, s.first_name`,
        [sectionId],
    )
    response.json({ roster: rows })
}))

// New: grade entry
facultyRouter.put('/enrollments/:enrollmentId/grade', requireFaculty, handle(async (request, response) => {
    const enrollmentId = await ownEnrollment(request)
    const grade = request.body?.finalGrade
    if (grade !== null && !GRADES.includes(grade)) {
        throw new ApiError(400, 'INVALID_INPUT', 'finalGrade must be A, B, C, D, F, or null.')
    }
    const { rows } = await pool.query(
        `UPDATE student_dashboard.enrollments
     SET final_grade = $1::varchar,
         grade_posted_at = CASE WHEN $1::varchar IS NULL THEN NULL ELSE now() END,
         updated_at = now()
     WHERE id = $2
     RETURNING id AS "enrollmentId", final_grade AS "finalGrade"`,
        [grade, enrollmentId],
    )
    response.json({ enrollment: rows[0] })
}))

facultyRouter.get('/sections/:sectionId/attendance', requireFaculty, handle(async (request, response) => {
    const sectionId = await ownSection(request)
    const date = parseDate(request.query.date)
    const { rows } = await pool.query(
        `SELECT e.id AS "enrollmentId", s.id AS "studentId",
            s.first_name AS "firstName", s.last_name AS "lastName",
            (SELECT a.status FROM student_dashboard.attendance_records a
              WHERE a.enrollment_id = e.id AND a.class_date = $2::date) AS status,
            (SELECT count(*)::int FROM student_dashboard.attendance_records a
              WHERE a.enrollment_id = e.id AND a.status = 'absent') AS absences
     FROM student_dashboard.enrollments e
     JOIN student_dashboard.students s ON s.id = e.student_id
     WHERE e.section_id = $1
     ORDER BY s.last_name, s.first_name`,
        [sectionId, date],
    )
    response.json({ attendance: rows })
}))

facultyRouter.put('/sections/:sectionId/attendance', requireFaculty, handle(async (request, response) => {
    const sectionId = await ownSection(request)
    const { date, records } = request.body ?? {}
    const classDate = parseDate(date)
    if (!Array.isArray(records) || records.length === 0 || records.length > 200 ||
        !records.every((r) => Number.isInteger(r?.enrollmentId) && STATUSES.includes(r?.status))) {
        throw new ApiError(400, 'INVALID_INPUT', 'Send records with an enrollmentId and a valid status.')
    }
    const ids = records.map((r) => r.enrollmentId)
    if (new Set(ids).size !== ids.length) {
        throw new ApiError(400, 'INVALID_INPUT', 'Each student can appear only once.')
    }
    // Every enrollment must belong to THIS section, or nothing is written.
    const check = await pool.query(
        `SELECT count(*)::int AS n FROM student_dashboard.enrollments
     WHERE section_id = $1 AND id = ANY($2::int[])`,
        [sectionId, ids],
    )
    if (check.rows[0].n !== ids.length) {
        throw new ApiError(400, 'INVALID_INPUT', 'One or more students are not enrolled in this section.')
    }
    // Insert new marks, or update the mark already saved for that student and date.
    await pool.query(
        `INSERT INTO student_dashboard.attendance_records (enrollment_id, class_date, status, recorded_by)
     SELECT r.enrollment_id, $1::date, r.status, $2::int
     FROM unnest($3::int[], $4::text[]) AS r(enrollment_id, status)
     ON CONFLICT (enrollment_id, class_date)
     DO UPDATE SET status = EXCLUDED.status, recorded_by = EXCLUDED.recorded_by, recorded_at = now()`,
        [classDate, request.faculty.id, ids, records.map((r) => r.status)],
    )
    response.json({ saved: records.length })
}))

facultyRouter.use((error, _request, response, _next) => {
    if (error instanceof ApiError) {
        return response.status(error.status).json({ error: error.apiCode, message: error.message })
    }
    if (error.type === 'entity.parse.failed') {
        return response.status(400).json({ error: 'INVALID_JSON', message: 'Provide valid JSON.' })
    }
    if (error.type === 'entity.too.large') {
        return response.status(413).json({ error: 'BODY_TOO_LARGE', message: 'Request body exceeds 16 KB.' })
    }
    if (typeof error.code === 'string' && (error.code.startsWith('22') || error.code === '23514')) {
        return response.status(400).json({ error: 'INVALID_INPUT', message: 'A value is not valid.' })
    }
    console.error('Faculty request failed:', error.code || error.name)
    response.status(503).json({
        error: 'DATABASE_UNAVAILABLE',
        message: 'Faculty records are unavailable. Check PostgreSQL and run database setup.',
    })
})