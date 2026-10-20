import { readFileSync } from 'node:fs'
import express from 'express'

// One fictional CSC 425 section. A missing row is not an absence.
const records = JSON.parse(readFileSync(new URL('./data/attendance.json', import.meta.url), 'utf8'))

function isValidDate(date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false
  const parsed = new Date(`${date}T00:00:00.000Z`)
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date
}

function summarize(attendance) {
  const present = attendance.filter((record) => record.status === 'present').length
  const late = attendance.filter((record) => record.status === 'late').length
  const absent = attendance.filter((record) => record.status === 'absent').length
  return {
    total: attendance.length,
    present,
    late,
    absent,
    // Late counts as attended. No recorded sessions means no percentage.
    attendancePercentage: attendance.length
      ? Number(((present + late) / attendance.length * 100).toFixed(2))
      : null,
  }
}

export function createAttendanceRouter(students) {
  const router = express.Router()

  router.get('/', (_request, response) => {
    response.json({ courseCode: 'CSC425', isMockData: true, count: records.length, records })
  })

  // Validate before looking up the student; share the same rules across routes.
  router.param('studentID', (request, response, next, studentID) => {
    if (!/^\d{4}$/.test(studentID)) {
      return response.status(400).json({
        error: 'INVALID_STUDENT_ID',
        message: 'Provide a four-digit studentID, for example /api/attendance/1001.',
      })
    }
    next()
  })

  router.param('date', (request, response, next, date) => {
    if (!isValidDate(date)) {
      return response.status(400).json({
        error: 'INVALID_DATE',
        message: 'Provide a real calendar date in YYYY-MM-DD format.',
      })
    }
    next()
  })

  function findStudent(request, response, next) {
    const student = students.find((student) => student.studentID === request.params.studentID)
    if (!student) {
      return response.status(404).json({
        error: 'STUDENT_NOT_FOUND',
        message: `No mock student was found with studentID ${request.params.studentID}.`,
      })
    }
    response.locals.student = student
    next()
  }

  router.get('/:studentID', findStudent, (request, response) => {
    const attendance = records.filter((record) => record.studentID === request.params.studentID)
    response.json({
      courseCode: 'CSC425',
      isMockData: true,
      student: response.locals.student,
      records: attendance,
      summary: summarize(attendance),
    })
  })

  router.get('/:studentID/:date', findStudent, (request, response) => {
    const { studentID, date } = request.params
    const record = records.find((record) => record.studentID === studentID && record.date === date)
    if (!record) {
      return response.status(404).json({
        error: 'ATTENDANCE_NOT_FOUND',
        message: `No attendance record was found for studentID ${studentID} on ${date}.`,
        studentID,
        date,
      })
    }
    response.json({ courseCode: 'CSC425', isMockData: true, record })
  })

  // A known resource with an unsupported verb is different from an unknown route.
  for (const path of ['/', '/:studentID', '/:studentID/:date']) {
    router.all(path, (_request, response) => {
      response.set('Allow', 'GET, HEAD, OPTIONS').status(405).json({
        error: 'METHOD_NOT_ALLOWED',
        message: 'Attendance is read-only. Use GET.',
      })
    })
  }
  router.use((_request, response) => {
    response.status(404).json({ error: 'ROUTE_NOT_FOUND', message: 'No attendance route matches this URL.' })
  })

  return router
}
