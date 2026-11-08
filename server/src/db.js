import pg from 'pg'

const { Pool } = pg

export const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  // Keep up to 10 connections open and reuse them across requests.
  max: 10,
  // Fail after 5 seconds instead of waiting forever when the database is down.
  connectionTimeoutMillis: 5000,
  // Close a connection that has been unused for 30 seconds.
  idleTimeoutMillis: 30000,
})

// An idle connection can drop (for example, if PostgreSQL restarts).
// Logging it keeps that from crashing the whole server.
pool.on('error', (error) => console.error('Idle database connection error:', error.code || error.message))

export async function checkDatabase() {
  const result = await pool.query('SELECT NOW() AS current_time')
  return result.rows[0]
}

