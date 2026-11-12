import { config } from 'dotenv'
import pg from 'pg'

// Resolve relative to this file so scripts also work from the repository root.
config({ path: new URL('../.env', import.meta.url), quiet: true })

const { Pool } = pg

export const databaseConfig = {
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 10,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
}

export const pool = new Pool(databaseConfig)
pool.on('error', (error) => console.error('Idle database connection failed:', error.code))

export async function checkDatabase() {
  const result = await pool.query('SELECT NOW() AS current_time')
  return result.rows[0]
}

