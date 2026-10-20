// Run from the repository root: npm run demo --prefix server
// Request/response cycle: client -> route -> PostgreSQL -> JSON response -> client.

// 1. Create the server and let Express read JSON request bodies.
import dotenv from 'dotenv'
import express from 'express'
import pg from 'pg'

// Load server/.env, even when this file is run from another folder.
dotenv.config({ path: new URL('../.env', import.meta.url), quiet: true })
const app = express()
app.use(express.json())

// 2. A pool manages reusable database connections. Credentials stay in .env.
const pool = new pg.Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  connectionTimeoutMillis: 3000,
})
pool.on('error', (error) => console.error('Database connection error:', error.message))

// 3. GET waits for the query, then sends the returned rows as JSON.
app.get('/api/students', async (req, res) => {
  const result = await pool.query(`
    SELECT student_id::text AS "studentID", first_name AS "firstName",
           last_name AS "lastName", major
    FROM endpoint_examples.students
    ORDER BY student_id
  `)
  res.json({ students: result.rows })
})

// 4. POST reads req.body, saves a row, and returns the saved student.
app.post('/api/students', async (req, res) => {
  const { firstName, lastName, major } = req.body ?? {}

  // Reject missing, non-text, or blank fields before changing our data.
  if (
    typeof firstName !== 'string' || firstName.trim() === '' ||
    typeof lastName !== 'string' || lastName.trim() === '' ||
    typeof major !== 'string' || major.trim() === ''
  ) {
    return res.status(400).json({ message: 'First name, last name, and major are required.' })
  }

  // $1, $2, and $3 keep user input separate from SQL. PostgreSQL assigns the ID.
  const result = await pool.query(`
    INSERT INTO endpoint_examples.students (first_name, last_name, major)
    VALUES ($1, $2, $3)
    RETURNING student_id::text AS "studentID", first_name AS "firstName",
              last_name AS "lastName", major
  `, [firstName.trim(), lastName.trim(), major.trim()])
  res.status(201).json({ message: 'Student created.', student: result.rows[0] })
})

// Express 5 sends failed async queries here instead of leaving requests waiting.
app.use((error, req, res, next) => {
  console.error('Request failed:', error.message)
  const status = error.status === 400 ? 400 : 500
  res.status(status).json({
    message: status === 400 ? 'Send a valid JSON request body.' : 'Unable to complete the request.',
  })
})

// 5. Check that the database/table is ready, then accept requests on port 3001.
try {
  await pool.query('SELECT student_id FROM endpoint_examples.students LIMIT 1')
  app.listen(3001, () => {
    console.log('PostgreSQL connected. Student example: http://localhost:3001/api/students')
  })
} catch (error) {
  console.error('Startup failed. Check server/.env and run setup.sql:', error.message)
  await pool.end()
  process.exitCode = 1
}
