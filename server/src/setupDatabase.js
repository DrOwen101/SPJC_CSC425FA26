import { readFile } from 'node:fs/promises'
import { connectDatabase, pool } from './db.js'

const { students } = JSON.parse(
  await readFile(new URL('./data/transcripts.json', import.meta.url), 'utf8'),
)
const schema = await readFile(new URL('./data/schema.sql', import.meta.url), 'utf8')

let client
let transactionStarted = false
try {
  client = await connectDatabase()
  await client.query('BEGIN')
  transactionStarted = true
  await client.query(schema)

  for (const student of students) {
    await client.query(
      `INSERT INTO students (student_id, first_name, last_name, major)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (student_id) DO NOTHING`,
      [student.studentID, student.firstName, student.lastName, student.major],
    )
    await client.query(
      `INSERT INTO transcripts (student_id, institution, is_mock_data, semesters, summary)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (student_id) DO NOTHING`,
      [
        student.studentID,
        student.institution,
        student.isMockData,
        JSON.stringify(student.semesters),
        JSON.stringify(student.summary),
      ],
    )
  }

  await client.query('COMMIT')
  transactionStarted = false
  console.log(`Database setup complete. Added schema and missing fixture records for ${students.length} students.`)
} catch (error) {
  if (client && transactionStarted) {
    try {
      await client.query('ROLLBACK')
    } catch (rollbackError) {
      console.error('Database rollback failed:', rollbackError.code || rollbackError.message)
    }
  }
  console.error('Database setup failed:', error.code || error.message)
  process.exitCode = 1
} finally {
  client?.release()
  await pool.end()
}
