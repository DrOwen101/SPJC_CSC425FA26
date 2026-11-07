import 'dotenv/config'
import { app } from './app.js'
import { pool } from './db.js' // Imports your PostgreSQL connection pool

const port = Number(process.env.PORT) || 3000
const host = process.env.HOST || '0.0.0.0'

// Helper function to run query on startup
async function fetchStudentsOnStartup() {
  try {
    const result = await pool.query('SELECT * FROM student')
    console.log('--- Startup Students Query ---')
    console.log('Students in database:', result.rows)
    console.log('------------------------------')
  } catch (error) {
    console.error('❌ Error fetching students on startup:', error.message)
  }
}

app.listen(port, host, () => {
  console.log(`CSC 425 API listening on http://localhost:${port}`)
  console.log(`Student lookup data: http://localhost:${port}/api/students`)
  console.log(`Example transcript: http://localhost:${port}/api/transcripts/1001`)

  // Triggers automatically when server starts
  fetchStudentsOnStartup()
})