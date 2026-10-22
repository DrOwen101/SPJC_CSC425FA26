import { pool } from '../src/db.js'
import { setupDatabase } from '../database/setup.js'
try {
  await setupDatabase()
  console.log('Student dashboard tables and fictional seed records are ready. Existing edits were preserved.')
} catch (error) {
  console.error('Database setup failed:', error.message)
  process.exitCode = 1
} finally {
  await pool.end()
}
