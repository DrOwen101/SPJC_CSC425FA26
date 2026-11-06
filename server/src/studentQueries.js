import { pool } from './db.js'

export async function getAllStudents() {
    const result = await pool.query('SELECT * FROM student_records.students')
    return result.rows
}

export async function getStudentById(studentID) {
    const result = await pool.query('SELECT s.*, m.code AS major_code, m.name AS major_name FROM student_records.students s JOIN student_records.majors m ON s.major_id = m.id WHERE s.id = $1', [studentID])
    return result.rows[0]
}

export async function createStudent(student) {
    const { first_name, last_name, email, major_code, enrollment_year, is_active } = student
    const result = await pool.query(
        'INSERT INTO student_records.students (first_name, last_name, email, major_id, enrollment_year, is_active) VALUES ($1, $2, $3, (SELECT id FROM student_records.majors WHERE code = $4), $5, $6) RETURNING *',
        [first_name, last_name, email, major_code.trim().toUpperCase(), enrollment_year, is_active]
    )
    return result.rows[0]
}

export async function updateStudent(studentID, student) {
    const { first_name, last_name, email, major_id, enrollment_year, is_active } = student
    const result = await pool.query(
        'UPDATE student_records.students SET first_name = $1, last_name = $2, email = $3, major_id = $4, enrollment_year = $5, is_active = $6 WHERE id = $7 RETURNING *',
        [first_name, last_name, email, major_id, enrollment_year, is_active, studentID]
    )
    return result.rows[0]
}

export async function deleteStudent(studentID) {
    const result = await pool.query('DELETE FROM student_records.students WHERE id = $1 RETURNING *', [studentID])
    return result.rows[0]
}

