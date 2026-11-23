import pg from 'pg'
import dotenv from 'dotenv'
import { fileURLToPath } from 'node:url'

const { Pool } = pg

dotenv.config({
  path: [
    fileURLToPath(new URL('../.env', import.meta.url)),
    fileURLToPath(new URL('./.env', import.meta.url)),
  ],
})

export const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
})

function validateDatabaseConfig() {
  const missing = ['DB_NAME', 'DB_USER'].filter((key) => !process.env[key]?.trim())
  if (missing.length > 0) {
    throw new Error(`Missing PostgreSQL configuration: ${missing.join(', ')}`)
  }

  const port = Number(process.env.DB_PORT || 5432)
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('DB_PORT must be an integer between 1 and 65535.')
  }
}

export async function queryDatabase(text, values) {
  validateDatabaseConfig()
  return pool.query(text, values)
}

export async function connectDatabase() {
  validateDatabaseConfig()
  return pool.connect()
}

export async function checkDatabase() {
  const result = await queryDatabase('SELECT NOW() AS current_time')
  return result.rows[0]
}
