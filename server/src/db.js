import pg from 'pg'

const { Pool } = pg

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

export async function ensureAttendanceTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS attendance_records (
      id SERIAL PRIMARY KEY,
      student_id VARCHAR(20) NOT NULL,
      course_code VARCHAR(30) NOT NULL,
      attendance_date DATE NOT NULL,
      status VARCHAR(20) NOT NULL,
      recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (student_id, course_code, attendance_date),
      CHECK (status IN ('Present', 'Absent', 'Excused'))
    )
  `)
}

