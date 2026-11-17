/**
 * API routes for faculty dashboard features.
 */

import { Router } from 'express'
import { pool } from './db.js'
import { requireRole } from './authMiddleware.js'

export const facultyRouter = Router()

// All routes in this router require the facutly role
facultyRouter.use(requireRole('faculty'))

// Retrieve sections assigned to the logged-in faculty member.
facultyRouter.get('/sections', async (request, response, next) => {
  try {
    const result = await pool.query(
      `SELECT
         s.id,
         s.course_id,
         s.semester,
         s.section_code
       FROM faculty_dashboard.sections s
       WHERE s.faculty_id = $1
       ORDER BY s.semester, s.section_code`,
      [request.user.faculty_id]
    )

    response.json({ sections: result.rows })
  } catch (error) {
    next(error)
  }
})


// Retrieve students enrolled in a faculty member's section.
facultyRouter.get('/sections/:sectionId/students', async (request, response, next) => {
  try {
    const sectionId = Number(request.params.sectionId)

    // Verify that the section ID is valid.
    if (!Number.isSafeInteger(sectionId) || sectionId <= 0) {
      return response.status(400).json({
        error: 'Invalid section ID',
      })
    }

    // Retrieve students only if the logged-in faculty member teaches the section.
    const result = await pool.query(
      `SELECT
         s.id AS student_id,
         s.first_name,
         s.last_name,
         s.email,
         s.is_active
       FROM faculty_dashboard.sections sec
       JOIN faculty_dashboard.section_enrollments se
         ON sec.id = se.section_id
       JOIN student_dashboard.students s
         ON se.student_id = s.id
       WHERE sec.id = $1
         AND sec.faculty_id = $2
       ORDER BY s.last_name, s.first_name`,
      [sectionId, request.user.faculty_id]
    )

    // Verify the faculty member has access even if no students are enrolled.
    const section = await pool.query(
      `SELECT id
       FROM faculty_dashboard.sections
       WHERE id = $1 AND faculty_id = $2`,
      [sectionId, request.user.faculty_id]
    )

    if (section.rows.length === 0) {
      return response.status(404).json({
        error: 'Section not found',
      })
    }

    response.json({ students: result.rows })
  } catch (error) {
    next(error)
  }
})
