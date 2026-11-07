
import { Router } from 'express'
import { pool } from './db.js'

export const studentRecordsRouter = Router()

// GET
// Retrieve all students with their majors and active status
studentRecordsRouter.get('/', async (_request, response) => {
  try {
    const result = await pool.query(`
      SELECT
        s.id,
        s.first_name,
        s.last_name,
        s.email,
        s.major_id,
        m.name AS major,
        s.enrollment_year,
        s.is_active
      FROM student_dashboard.students s
      JOIN student_dashboard.majors m
        ON s.major_id = m.id
      ORDER BY s.id
    `)

    response.json({ students: result.rows })
  } catch (error) {
    console.error('Error retrieving students:', error)
    response.status(500).json({ error: 'Failed to retrieve students' })
  }
})

// GET
// Retrieve one student by ID
studentRecordsRouter.get('/:id', async (request, response) => {
  try {
    const { id } = request.params

    if (!/^\d+$/.test(id)) {
      return response.status(400).json({ error: 'Invalid student ID' })
    }

    const result = await pool.query(
      `SELECT s.*, m.name AS major
       FROM student_dashboard.students s
       JOIN student_dashboard.majors m ON s.major_id = m.id
       WHERE s.id = $1`,
      [id]
    )

    if (result.rows.length === 0) {
      return response.status(404).json({ error: 'Student not found' })
    }

    response.json(result.rows[0])
  } catch (error) {
    console.error('Error retrieving student:', error)
    response.status(500).json({ error: 'Failed to retrieve student' })
  }
})

// POST
// Create a new student with an active or inactive status
studentRecordsRouter.post('/', async (request, response) => {
  try {
    const {
      first_name,
      last_name,
      email,
      major_id,
      enrollment_year,
      is_active,
    } = request.body

    // Make sure all required student information is provided
    if (!first_name || !last_name || !email || !major_id || !enrollment_year) {
      return response.status(400).json({ error: 'All fields are required' })
    }

    // Student status must be a boolean value (true or false)
    if (typeof is_active !== 'boolean') {
      return response.status(400).json({
        error: 'Student status must be true or false',
      })
    }

    const result = await pool.query(
      `INSERT INTO student_dashboard.students
       (first_name, last_name, email, major_id, enrollment_year, is_active)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        first_name,
        last_name,
        email,
        major_id,
        enrollment_year,
        is_active,
      ]
    )

    response.status(201).json(result.rows[0])
  } catch (error) {
    console.error('Error creating student:', error)

    if (error.code === '23505') {
      return response.status(409).json({ error: 'Student email already exists' })
    }

    if (error.code === '23503') {
      return response.status(400).json({ error: 'Invalid major ID' })
    }

    response.status(500).json({ error: 'Failed to create student' })
  }
})

// PUT
// Update an existing student's information and active status
studentRecordsRouter.put('/:id', async (request, response) => {
  try {
    const { id } = request.params
    const {
      first_name,
      last_name,
      email,
      major_id,
      enrollment_year,
      is_active,
    } = request.body

    if (!/^\d+$/.test(id)) {
      return response.status(400).json({ error: 'Invalid student ID' })
    }

    // Make sure all required student information is provided
    if (!first_name || !last_name || !email || !major_id || !enrollment_year) {
      return response.status(400).json({ error: 'All fields are required' })
    }

    // Student status must be a boolean value (true or false)
    if (typeof is_active !== 'boolean') {
      return response.status(400).json({
        error: 'Student status must be true or false',
      })
    }

    const result = await pool.query(
      `UPDATE student_dashboard.students
       SET first_name = $1,
           last_name = $2,
           email = $3,
           major_id = $4,
           enrollment_year = $5,
           is_active = $6,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $7
       RETURNING *`,
      [
        first_name,
        last_name,
        email,
        major_id,
        enrollment_year,
        is_active,
        id,
      ]
    )

    if (result.rows.length === 0) {
      return response.status(404).json({ error: 'Student not found' })
    }

    response.json(result.rows[0])
  } catch (error) {
    console.error('Error updating student:', error)

    if (error.code === '23505') {
      return response.status(409).json({ error: 'Student email already exists' })
    }

    if (error.code === '23503') {
      return response.status(400).json({ error: 'Invalid major ID' })
    }

    response.status(500).json({ error: 'Failed to update student' })
  }
})

// DELETE
// Permanently delete a student from PostgreSQL
studentRecordsRouter.delete('/:id', async (request, response) => {
  try {
    const { id } = request.params

    if (!/^\d+$/.test(id)) {
      return response.status(400).json({ error: 'Invalid student ID' })
    }

    const result = await pool.query(
      `DELETE FROM student_dashboard.students
       WHERE id = $1
       RETURNING *`,
      [id]
    )

    if (result.rows.length === 0) {
      return response.status(404).json({ error: 'Student not found' })
    }

    response.json({
      message: 'Student deleted successfully',
      student: result.rows[0],
    })
  } catch (error) {
    console.error('Error deleting student:', error)

    if (error.code === '23503') {
      return response.status(409).json({
        error: 'Cannot delete a student with existing enrollments',
      })
    }

    response.status(500).json({ error: 'Failed to delete student' })
  }
})
