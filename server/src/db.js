import pg from 'pg'


const { Pool } = pg

export const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
})

export async function checkDatabase() {
  const result = await pool.query('SELECT NOW() AS current_time')
  return result.rows[0]
}

export async function getStudent() {
  const result = await pool.query(`
    SELECT
      student_id AS "studentID",
      first_name AS "firstName",
      last_name AS "lastName",
      COALESCE(major, '') AS "major"
    FROM students
    ORDER BY student_id
  `)
  return result.rows
}

export async function getEnrollment(studentID) {
  const result = await pool.query(`
    SELECT
      c.course_name AS "courseName"
    FROM enrollments AS e
    JOIN courses AS c ON c.course_id = e.course_id
    WHERE e.student_id = $1
    ORDER BY e.enrolled_on, c.course_name
  `, [studentID])

  return result.rows
}

export async function createStudent(student) {
  const result = await pool.query(`
    INSERT INTO students (student_id, first_name, last_name, major)
    VALUES ($1, $2, $3, $4)
    RETURNING student_id AS "studentID",
              first_name AS "firstName",
              last_name AS "lastName",
              COALESCE(major, '') AS "major"
  `, [student.studentID, student.firstName, student.lastName, student.major])

  return result.rows[0]
}

export async function updateStudent(studentID, student) {
  const result = await pool.query(`
    UPDATE students
    SET first_name = $2,
        last_name = $3,
        major = $4
    WHERE student_id = $1
    RETURNING student_id AS "studentID",
              first_name AS "firstName",
              last_name AS "lastName",
              COALESCE(major, '') AS "major"
  `, [studentID, student.firstName, student.lastName, student.major])

  return result.rows[0]
}

export async function deleteStudent(studentID) {
  const result = await pool.query(`
    DELETE FROM students
    WHERE student_id = $1
    RETURNING student_id AS "studentID"
  `, [studentID])

  return result.rows[0] ?? null
}