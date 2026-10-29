import { readFile } from 'node:fs/promises'
import { pool } from '../src/db.js'

// Apply schema and non-destructive classroom seeds in one transaction.
let client
try {
  client = await pool.connect()
  await client.query('BEGIN')
  const files = process.argv.includes('--transcripts-only')
    ? ['003_transcripts.sql', '004_transcript_samples.sql']
    : ['001_student_records.sql', '002_sample_inserts.sql', '003_transcripts.sql', '004_transcript_samples.sql']
  for (const file of files) {
    await client.query(await readFile(new URL(file, import.meta.url), 'utf8'))
  }
  await client.query('COMMIT')
  console.log('Student records and transcript schema and fictional samples are ready.')
} catch (error) {
  if (client) await client.query('ROLLBACK')
  console.error('Database setup failed:', error.message)
  process.exitCode = 1
} finally {
  client?.release()
  await pool.end()
}
