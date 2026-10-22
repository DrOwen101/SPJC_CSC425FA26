// These identifiers are server-owned. Request values always use SQL parameters.
export const gradePoints = { 'A+': 4, A: 4, 'A-': 3.7, 'B+': 3.3, B: 3, 'B-': 2.7, 'C+': 2.3, C: 2, 'C-': 1.7, 'D+': 1.3, D: 1, 'D-': 0.7, F: 0 }
export const resources = {
  students: { table: 'students', key: 'student_id', fields: { studentID: 'student_id', firstName: 'first_name', lastName: 'last_name', major: 'major' } },
  courses: { table: 'courses', key: 'id', fields: { courseCode: 'course_code', courseTitle: 'course_title', creditHours: 'credit_hours' } },
  enrollments: { table: 'enrollments', key: 'id', scoped: true, fields: { courseID: 'course_id', term: 'term', status: 'status', grade: 'grade', meetingTime: 'meeting_time', location: 'location' } },
  attendance: { table: 'attendance', key: 'id', scoped: true, fields: { enrollmentID: 'enrollment_id', date: 'attendance_date', status: 'status' } },
  alerts: { table: 'alerts', key: 'id', scoped: true, fields: { message: 'message', dueDate: 'due_date', isRead: 'is_read' } },
  'gpa-entries': { table: 'gpa_entries', key: 'id', scoped: true, fields: { grade: 'grade' } },
}

export class ApiError extends Error {
  constructor(status, code, message) { super(message); this.status = status; this.code = code }
}
export function studentID(value) {
  if (typeof value !== 'string' || !/^\d{4}$/.test(value)) throw new ApiError(400, 'INVALID_STUDENT_ID', 'Provide a four-digit studentID.')
  return value
}
export function recordID(value) {
  if (!/^[1-9]\d*$/.test(String(value)) || !Number.isSafeInteger(Number(value)) || Number(value) > 2147483647) throw new ApiError(400, 'INVALID_ID', 'Provide a positive integer record ID.')
  return Number(value)
}
function invalid(message) { throw new ApiError(400, 'INVALID_INPUT', message) }
function text(value, label, max, optional = false) {
  if (typeof value !== 'string' || (!optional && !value.trim()) || value.trim().length > max) invalid(`${label} must be ${optional ? 'at most' : '1–'}${max} characters.`)
  return value.trim()
}
function choice(value, values, label) {
  if (!values.includes(value)) invalid(`${label} must be one of: ${values.join(', ')}.`)
  return value
}
function date(value, optional = false) {
  if (optional && (value === null || value === '')) return null
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || value < '0001-01-01') invalid('Use a valid date in YYYY-MM-DD format.')
  const parsed = new Date(`${value}T00:00:00Z`)
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) invalid('Use a valid calendar date.')
  return value
}
export function validateBody(name, body, updating = false) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) invalid('A JSON object is required.')
  const allowed = Object.keys(resources[name].fields).filter((key) => !(updating && key === 'studentID'))
  if (Object.keys(body).some((key) => !allowed.includes(key))) invalid('The request contains unsupported fields.')
  switch (name) {
    case 'students': return {
      ...(!updating && { studentID: studentID(body.studentID) }),
      firstName: text(body.firstName, 'First name', 80), lastName: text(body.lastName, 'Last name', 80), major: text(body.major, 'Major', 120),
    }
    case 'courses':
      if (!Number.isInteger(body.creditHours) || body.creditHours < 1 || body.creditHours > 12) invalid('Credit hours must be a whole number from 1 to 12.')
      return { courseCode: text(body.courseCode, 'Course code', 20), courseTitle: text(body.courseTitle, 'Course title', 160), creditHours: body.creditHours }
    case 'enrollments': {
      const status = choice(body.status, ['upcoming', 'completed'], 'Status')
      if (status === 'upcoming' && body.grade != null && body.grade !== '') invalid('Upcoming courses cannot have a final grade.')
      return { courseID: recordID(body.courseID), term: text(body.term, 'Term', 60), status,
        grade: status === 'completed' ? choice(body.grade, Object.keys(gradePoints), 'Grade') : null,
        meetingTime: text(body.meetingTime ?? '', 'Meeting time', 120, true), location: text(body.location ?? '', 'Location', 120, true) }
    }
    case 'attendance': return { enrollmentID: recordID(body.enrollmentID), date: date(body.date), status: choice(body.status, ['present', 'absent', 'late', 'excused'], 'Status') }
    case 'alerts':
      if (typeof body.isRead !== 'boolean') invalid('Read status must be true or false.')
      return { message: text(body.message, 'Message', 500), dueDate: date(body.dueDate ?? null, true), isRead: body.isRead }
    case 'gpa-entries': return { grade: choice(body.grade, Object.keys(gradePoints), 'Grade') }
  }
}

export function selectFields(resource, prefix = '') {
  const fields = Object.entries(resource.fields).map(([key, column]) => {
    const expression = ['attendance_date', 'due_date'].includes(column) ? `to_char(${prefix}${column}, 'YYYY-MM-DD')` : `${prefix}${column}`
    return `${expression} AS "${key}"`
  })
  if (resource.key === 'id') fields.unshift(`${prefix}id`)
  return fields.join(', ')
}

export async function requireStudent(db, id) {
  const { rows } = await db.query(`SELECT ${selectFields(resources.students)} FROM student_dashboard.students WHERE student_id=$1`, [id])
  if (!rows.length) throw new ApiError(404, 'STUDENT_NOT_FOUND', `No student was found with studentID ${id}.`)
  return rows[0]
}

export async function listRecords(db, name, id) {
  const resource = resources[name]
  if (name === 'attendance') {
    const result = await db.query(`SELECT ${selectFields(resource, 'a.')}, c.course_code AS "courseCode", e.term
      FROM student_dashboard.attendance a JOIN student_dashboard.enrollments e ON e.id=a.enrollment_id
      JOIN student_dashboard.courses c ON c.id=e.course_id WHERE e.student_id=$1 ORDER BY a.attendance_date, a.id`, [id])
    return result.rows
  }
  if (name === 'enrollments') {
    const result = await db.query(`SELECT ${selectFields(resource, 'e.')}, c.course_code AS "courseCode", c.course_title AS "courseTitle", c.credit_hours AS "creditHours"
      FROM student_dashboard.enrollments e JOIN student_dashboard.courses c ON c.id=e.course_id WHERE e.student_id=$1 ORDER BY e.id`, [id])
    return result.rows
  }
  const result = await db.query(`SELECT ${selectFields(resource)} FROM student_dashboard.${resource.table}
    ${resource.scoped ? 'WHERE student_id=$1' : ''} ORDER BY ${resource.key}`, resource.scoped ? [id] : [])
  return result.rows
}

export function transcriptFor(student, enrollments) {
  const terms = new Map()
  for (const enrollment of enrollments.filter((row) => row.status === 'completed')) {
    const courses = terms.get(enrollment.term) || []
    courses.push({ courseCode: enrollment.courseCode, courseTitle: enrollment.courseTitle, creditHours: enrollment.creditHours, grade: enrollment.grade })
    terms.set(enrollment.term, courses)
  }
  let creditsAttempted = 0, creditsEarned = 0, quality = 0
  const semesters = [...terms].map(([term, courses]) => {
    const attempted = courses.reduce((n, c) => n + c.creditHours, 0)
    const earned = courses.reduce((n, c) => n + (c.grade === 'F' ? 0 : c.creditHours), 0)
    const points = courses.reduce((n, c) => n + c.creditHours * gradePoints[c.grade], 0)
    creditsAttempted += attempted; creditsEarned += earned; quality += points
    return { term, courses, creditsAttempted: attempted, creditsEarned: earned, gpa: Number((points / attempted).toFixed(2)) }
  })
  return { ...student, institution: 'San Pedro Junior College', isMockData: true, semesters,
    summary: { creditsAttempted, creditsEarned, cumulativeGPA: creditsAttempted ? Number((quality / creditsAttempted).toFixed(2)) : 0 } }
}
