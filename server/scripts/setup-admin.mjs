import { randomBytes } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import { pool } from '../src/db.js'
import { derivePasswordHash } from '../src/facultyAuth.js'

const credentialsFile = new URL('../.env.lab13-admin', import.meta.url)

async function getPassword() {
  try {
    return (await readFile(credentialsFile, 'utf8')).trim()
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
    const password = randomBytes(18).toString('base64url')
    await writeFile(credentialsFile, password + '\n', { flag: 'wx', mode: 0o600 })
    return password
  }
}

try {
  await pool.query(await readFile(new URL('../sql/06-admin-schema.sql', import.meta.url), 'utf8'))
  const password = await getPassword()
  if (password.length < 16 || password.length > 128) throw new Error('Invalid local demo password file.')
  const salt = randomBytes(16).toString('hex')
  const hash = await derivePasswordHash(password, salt, 64)
  const result = await pool.query(`
    INSERT INTO faculty_dashboard.accounts (username, display_name, role, password_salt, password_hash)
    VALUES ('admin-demo', 'Alex Patel', 'admin', $1, $2)
    ON CONFLICT (username) DO UPDATE SET password_salt = $1, password_hash = $2
    WHERE accounts.role = 'admin'
  `, [salt, hash.toString('hex')])
  if (!result.rowCount) throw new Error('The admin-demo username is already used by another role.')
  console.log('Admin demo ready. Username: admin-demo. Local password file: server/.env.lab13-admin')
} catch (error) {
  console.error('Admin setup failed:', error.message)
  process.exitCode = 1
} finally {
  await pool.end()
}
