import dotenv from 'dotenv'
import pg from 'pg'
dotenv.config({
  path: new URL('../.env', import.meta.url),
  quiet: true,
})
const pool = new pg.Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  connectionTimeoutMillis: 3000,
})
export async function getStudents() {
  const result = await pool.query(`
    SELECT student_id::text AS "studentID",
           first_name AS "firstName", last_name AS "lastName", major
    FROM students
    ORDER BY student_id
  `)
  return result.rows
}
export async function addStudent(firstName, lastName, major) {
  const result = await pool.query(`
    INSERT INTO students (first_name, last_name, major)
    VALUES ($1, $2, $3)
    RETURNING student_id::text AS "studentID",
              first_name AS "firstName", last_name AS "lastName", major
  `, [firstName, lastName, major])
  return result.rows[0]
}
