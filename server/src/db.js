import dotenv from 'dotenv'
import pg from 'pg'

// Resolve from this file so npm scripts and direct node commands use the same .env.
dotenv.config({ path: new URL('../.env', import.meta.url), quiet: true })

export const databaseConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME || 'csc425fa26',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  max: 10,
  connectionTimeoutMillis: 5000,
  statement_timeout: 10000,
}
export const pool = new pg.Pool(databaseConfig)

pool.on('error', (error) => console.error('Idle database connection failed:', error.code))

export async function checkDatabase() {
  const result = await pool.query('SELECT NOW() AS current_time')
  return result.rows[0]
}
