import 'dotenv/config'
import { createInterface } from 'node:readline/promises'
import { Writable } from 'node:stream'
import bcrypt from 'bcryptjs'
import { pool } from './db.js'

async function createFaculty() {
  if (!process.stdin.isTTY) {
    throw new Error('Run this script in an interactive terminal.')
  }

  const silentOutput = new Writable({
    write(_chunk, _encoding, callback) {
      callback()
    },
  })
  const input = createInterface({
    input: process.stdin,
    output: silentOutput,
    terminal: true,
  })

  try {
    process.stdout.write('Username: ')
    const username = (await input.question('')).trim()
    process.stdout.write('\nProfessor ID (for example professor1): ')
    const professorID = (await input.question('')).trim()
    process.stdout.write('\nPassword (at least 12 characters): ')
    const password = await input.question('')
    process.stdout.write('\n')

    if (!username || !professorID || password.length < 12) {
      throw new Error('Provide a username, professor ID, and password of at least 12 characters.')
    }

    const passwordHash = await bcrypt.hash(password, 12)
    await pool.query(`
      INSERT INTO app_users (username, password_hash, role, professor_id)
      VALUES ($1, $2, 'faculty', $3)
    `, [username, passwordHash, professorID])

    console.log('Faculty account created.')
  } finally {
    input.close()
    await pool.end()
  }
}

createFaculty().catch((error) => {
  console.error('Could not create faculty account:', error.message)
  process.exitCode = 1
})