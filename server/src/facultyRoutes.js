/** Faculty-only routes for section rosters, attendance, grades, and summaries. */

import { Router } from 'express'
import { pool } from './db.js'
import { requireRole } from './authMiddleware.js'

export const facultyRouter = Router()

facultyRouter.use(requireRole('faculty'))

function positiveId(value) {
  const id = Number(value)
  return Number.isSafeInteger(id) && id > 0 ? id : null
}

function validDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false
  }

  const date = new Date(`${value}T00:00:00Z`)

  return (
    !Number.isNaN(date.valueOf()) &&
    date.toISOString().slice(0, 10) === value
  )
}

// Verify ownership for all section-specific endpoints.
facultyRouter.param(
  'sectionId',
  async (request, response, next, value) => {
    const sectionId = positiveId(value)

    if (!sectionId) {
      return response.status(400).json({
        error: 'Invalid section ID',
      })
    }

    try {
      const result = await pool.query(
        `SELECT id FROM faculty_dashboard.sections
         WHERE id = $1 AND faculty_id = $2`,
        [sectionId, request.user.faculty_id]
      )

      if (!result.rows.length) {
        return response.status(404).json({
          error: 'Section not found',
        })
      }

      request.sectionId = sectionId
      next()
    } catch (error) {
      next(error)
    }
  }
)

// Assigned faculty sections.
facultyRouter.get(
  '/sections',
  async (request, response, next) => {
    try {
      const result = await pool.query(
        `SELECT sec.id, sec.course_id, c.course_code, c.course_name,
                sec.semester, sec.section_code
         FROM faculty_dashboard.sections sec
         JOIN student_dashboard.courses c ON c.id = sec.course_id
         WHERE sec.faculty_id = $1
         ORDER BY sec.semester, c.course_code, sec.section_code`,
        [request.user.faculty_id]
      )

      response.json({ sections: result.rows })
    } catch (error) {
      next(error)
    }
  }
)

// Students enrolled in the selected section.
facultyRouter.get(
  '/sections/:sectionId/students',
  async (request, response, next) => {
    try {
      const result = await pool.query(
        `SELECT s.id AS student_id, s.first_name, s.last_name,
                s.email, s.is_active
         FROM faculty_dashboard.section_enrollments se
         JOIN student_dashboard.students s ON s.id = se.student_id
         WHERE se.section_id = $1
         ORDER BY s.last_name, s.first_name`,
        [request.sectionId]
      )

      response.json({ students: result.rows })
    } catch (error) {
      next(error)
    }
  }
)

// Attendance for enrolled students on one class date.
facultyRouter.get(
  '/sections/:sectionId/attendance',
  async (request, response, next) => {
    if (!validDate(request.query.date)) {
      return response.status(400).json({
        error: 'A valid YYYY-MM-DD date is required',
      })
    }

    try {
      const result = await pool.query(
        `SELECT s.id AS student_id, s.first_name, s.last_name, a.status
         FROM faculty_dashboard.section_enrollments se
         JOIN student_dashboard.students s ON s.id = se.student_id
         LEFT JOIN faculty_dashboard.attendance a
           ON a.section_enrollment_id = se.id
           AND a.class_date = $2::date
         WHERE se.section_id = $1
         ORDER BY s.last_name, s.first_name`,
        [request.sectionId, request.query.date]
      )

      response.json({ attendance: result.rows })
    } catch (error) {
      next(error)
    }
  }
)

// Save attendance.
facultyRouter.put(
  '/sections/:sectionId/attendance',
  async (request, response, next) => {
    const { studentId, date, status } = request.body ?? {}
    const id = positiveId(studentId)

    if (
      !id ||
      !validDate(date) ||
      !['present', 'absent', 'excused'].includes(status)
    ) {
      return response.status(400).json({
        error: 'Valid studentId, date, and status are required',
      })
    }

    try {
      const result = await pool.query(
        `INSERT INTO faculty_dashboard.attendance
           (section_enrollment_id, class_date, status)
         SELECT se.id, $4::date, $5
         FROM faculty_dashboard.section_enrollments se
         JOIN faculty_dashboard.sections sec ON sec.id = se.section_id
         WHERE sec.id = $1
           AND sec.faculty_id = $2
           AND se.student_id = $3
         ON CONFLICT (section_enrollment_id, class_date)
         DO UPDATE SET status = EXCLUDED.status
         RETURNING id, status`,
        [
          request.sectionId,
          request.user.faculty_id,
          id,
          date,
          status,
        ]
      )

      if (!result.rows.length) {
        return response.status(404).json({
          error: 'Enrollment not found',
        })
      }

      response.json({
        message: 'Attendance saved',
        attendance: result.rows[0],
      })
    } catch (error) {
      next(error)
    }
  }
)

// Get assessments.
facultyRouter.get(
  '/sections/:sectionId/assessments',
  async (request, response, next) => {
    try {
      const result = await pool.query(
        `SELECT id, assessment_name,
                max_points::float8 AS max_points
         FROM faculty_dashboard.assessments
         WHERE section_id = $1
         ORDER BY id`,
        [request.sectionId]
      )

      response.json({ assessments: result.rows })
    } catch (error) {
      next(error)
    }
  }
)

// Create an assessment.
facultyRouter.post(
  '/sections/:sectionId/assessments',
  async (request, response, next) => {
    const name =
      typeof request.body?.name === 'string'
        ? request.body.name.trim()
        : ''

    const maxPoints = request.body?.maxPoints

    if (
      !name ||
      name.length > 150 ||
      typeof maxPoints !== 'number' ||
      !Number.isFinite(maxPoints) ||
      maxPoints <= 0 ||
      maxPoints > 999999.99
    ) {
      return response.status(400).json({
        error: 'Valid assessment name and positive maximum points are required',
      })
    }

    try {
      const result = await pool.query(
        `INSERT INTO faculty_dashboard.assessments
           (section_id, assessment_name, max_points)
         VALUES ($1, $2, $3)
         ON CONFLICT (section_id, assessment_name)
         DO NOTHING
         RETURNING id, assessment_name,
                   max_points::float8 AS max_points`,
        [request.sectionId, name, maxPoints]
      )

      if (!result.rows.length) {
        return response.status(409).json({
          error: 'Assessment already exists',
        })
      }

      response.status(201).json({
        assessment: result.rows[0],
      })
    } catch (error) {
      next(error)
    }
  }
)

// Get saved scores for one assessment.
facultyRouter.get(
  '/sections/:sectionId/assessments/:assessmentId/scores',
  async (request, response, next) => {
    const assessmentId = positiveId(request.params.assessmentId)

    if (!assessmentId) {
      return response.status(400).json({
        error: 'Invalid assessment ID',
      })
    }

    try {
      const check = await pool.query(
        `SELECT id
         FROM faculty_dashboard.assessments
         WHERE id = $1 AND section_id = $2`,
        [assessmentId, request.sectionId]
      )

      if (!check.rows.length) {
        return response.status(404).json({
          error: 'Assessment not found',
        })
      }

      const result = await pool.query(
        `SELECT se.student_id, s.first_name, s.last_name,
                g.score::float8 AS score
         FROM faculty_dashboard.section_enrollments se
         JOIN student_dashboard.students s ON s.id = se.student_id
         LEFT JOIN faculty_dashboard.grades g
           ON g.section_enrollment_id = se.id
           AND g.assessment_id = $2
         WHERE se.section_id = $1
         ORDER BY s.last_name, s.first_name`,
        [request.sectionId, assessmentId]
      )

      response.json({ scores: result.rows })
    } catch (error) {
      next(error)
    }
  }
)

// Save an assessment grade.
facultyRouter.put(
  '/sections/:sectionId/grades',
  async (request, response, next) => {
    const { studentId, assessmentId, score } = request.body ?? {}

    const sid = positiveId(studentId)
    const aid = positiveId(assessmentId)

    if (
      !sid ||
      !aid ||
      typeof score !== 'number' ||
      !Number.isFinite(score) ||
      score < 0
    ) {
      return response.status(400).json({
        error: 'Valid studentId, assessmentId, and nonnegative score required',
      })
    }

    try {
      const max = await pool.query(
        `SELECT max_points::float8 AS max_points
         FROM faculty_dashboard.assessments
         WHERE id = $1 AND section_id = $2`,
        [aid, request.sectionId]
      )

      if (!max.rows.length) {
        return response.status(404).json({
          error: 'Assessment not found',
        })
      }

      if (
        score > max.rows[0].max_points ||
        score > 999999.99
      ) {
        return response.status(400).json({
          error: 'Score exceeds assessment maximum',
        })
      }

      const result = await pool.query(
        `INSERT INTO faculty_dashboard.grades
           (section_id, section_enrollment_id, assessment_id, score)
         SELECT se.section_id, se.id, $4, $5
         FROM faculty_dashboard.section_enrollments se
         JOIN faculty_dashboard.sections sec
           ON sec.id = se.section_id
         WHERE sec.id = $1
           AND sec.faculty_id = $2
           AND se.student_id = $3
         ON CONFLICT (section_enrollment_id, assessment_id)
         DO UPDATE SET score = EXCLUDED.score
         RETURNING id, score::float8 AS score`,
        [
          request.sectionId,
          request.user.faculty_id,
          sid,
          aid,
          score,
        ]
      )

      if (!result.rows.length) {
        return response.status(404).json({
          error: 'Enrollment not found',
        })
      }

      response.json({
        message: 'Grade saved',
        grade: result.rows[0],
      })
    } catch (error) {
      next(error)
    }
  }
)

// Section grade summary.
facultyRouter.get(
  '/sections/:sectionId/summary',
  async (request, response, next) => {
    try {
      const result = await pool.query(
        `SELECT se.student_id, s.first_name, s.last_name,
                COUNT(g.id)::int AS graded_count,
                CASE WHEN COUNT(g.id) = 0 THEN NULL
                     ELSE ROUND(
                       100 * SUM(g.score) /
                       NULLIF(SUM(a.max_points), 0), 2
                     )::float8
                END AS current_percentage
         FROM faculty_dashboard.section_enrollments se
         JOIN student_dashboard.students s ON s.id = se.student_id
         LEFT JOIN faculty_dashboard.grades g
           ON g.section_enrollment_id = se.id
         LEFT JOIN faculty_dashboard.assessments a
           ON a.id = g.assessment_id
         WHERE se.section_id = $1
         GROUP BY se.student_id, s.first_name, s.last_name
         ORDER BY s.last_name, s.first_name`,
        [request.sectionId]
      )

      response.json({ summary: result.rows })
    } catch (error) {
      next(error)
    }
  }
)

// Faculty-only, section-specific student academic report.
facultyRouter.get(
  '/sections/:sectionId/students/:studentId/grade-report',
  async (request, response, next) => {
    const studentId = positiveId(request.params.studentId)

    if (!studentId) {
      return response.status(400).json({
        error: 'Invalid student ID',
      })
    }

    try {
      // Confirm that the student belongs to the assigned section.
      const enrollment = await pool.query(
        `SELECT s.id AS student_id, s.first_name, s.last_name
         FROM faculty_dashboard.section_enrollments se
         JOIN student_dashboard.students s ON s.id = se.student_id
         WHERE se.section_id = $1 AND se.student_id = $2`,
        [request.sectionId, studentId]
      )

      if (!enrollment.rows.length) {
        return response.status(404).json({
          error: 'Student not enrolled in this section',
        })
      }

      // Fetch the selected student's assessments and recorded scores.
      const result = await pool.query(
        `SELECT a.assessment_name,
                a.max_points::float8 AS max_points,
                g.score::float8 AS score
         FROM faculty_dashboard.assessments a
         LEFT JOIN faculty_dashboard.section_enrollments se
           ON se.section_id = a.section_id
           AND se.student_id = $2
         LEFT JOIN faculty_dashboard.grades g
           ON g.assessment_id = a.id
           AND g.section_enrollment_id = se.id
         WHERE a.section_id = $1
         ORDER BY a.id`,
        [request.sectionId, studentId]
      )

      const graded = result.rows.filter(
        (row) => row.score !== null
      )

      const earned = graded.reduce(
        (sum, row) => sum + row.score,
        0
      )

      const possible = graded.reduce(
        (sum, row) => sum + row.max_points,
        0
      )

      response.json({
        student: enrollment.rows[0],
        grades: result.rows,
        current_percentage:
          possible > 0
            ? Math.round((earned / possible) * 10000) / 100
            : null,
      })
    } catch (error) {
      next(error)
    }
  }
)