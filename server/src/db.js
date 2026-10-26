import pg from 'pg'
import pkg from 'pg';


const { Pool } = pg, pkg = pkg;

export const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
})

export async function checkDatabase() {
  const result = await pool.query('SELECT NOW() AS current_time')
  return result.rows[0]
}

