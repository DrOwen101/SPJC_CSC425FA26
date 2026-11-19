import { randomBytes } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import { pool } from '../src/db.js'
import { derivePasswordHash } from '../src/facultyAuth.js'

const credentialsFile = new URL('../.env.lab12-accounts', import.meta.url)
const profiles = [
  { username: 'faculty-demo', displayName: 'Jamie Rivera', role: 'faculty' },
  { username: 'faculty-other', displayName: 'Casey Monroe', role: 'faculty' },
  { username: 'student-demo', displayName: 'Robin Ellis', role: 'student' },
]

async function loadCredentials() {
  try {
    return JSON.parse(await readFile(credentialsFile, 'utf8'))
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
    const accounts = profiles.map((profile) => ({
      ...profile, password: randomBytes(15).toString('base64url'),
    }))
    await writeFile(credentialsFile, JSON.stringify(accounts, null, 2) + '\n', { flag: 'wx', mode: 0o600 })
    return accounts
  }
}

try {
  await pool.query(await readFile(new URL('../sql/04-faculty-schema.sql', import.meta.url), 'utf8'))
  const credentials = await loadCredentials()
  const db = await pool.connect()
  try {
    await db.query('BEGIN')
    for (const profile of profiles) {
      const password = credentials.find((item) => item.username === profile.username)?.password
      if (typeof password !== 'string' || password.length < 16) throw new Error('Invalid local demo credentials file.')
      const salt = randomBytes(16).toString('hex')
      const hash = await derivePasswordHash(password, salt, 64)
      await db.query(`
        INSERT INTO faculty_dashboard.accounts (username, display_name, role, password_salt, password_hash)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (username) DO UPDATE
        SET display_name = EXCLUDED.display_name, role = EXCLUDED.role,
            password_salt = EXCLUDED.password_salt, password_hash = EXCLUDED.password_hash
      `, [profile.username, profile.displayName, profile.role, salt, hash.toString('hex')])
    }
    await db.query(await readFile(new URL('../sql/05-faculty-samples.sql', import.meta.url), 'utf8'))
    await db.query('COMMIT')
  } catch (error) {
    await db.query('ROLLBACK')
    throw error
  } finally {
    db.release()
  }
  console.log('Faculty schema and fictional fixtures are ready. Read server/.env.lab12-accounts for the local logins.')
} catch (error) {
  console.error('Faculty setup failed:', error.message)
  process.exitCode = 1
} finally {
  await pool.end()
}
