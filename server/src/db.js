import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'
import pg from 'pg'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.resolve(__dirname, '../.env') })
dotenv.config({ path: path.resolve(__dirname, './.env') })

const { Pool } = pg

const dbUser = process.env.DB_USER || 'postgres'
const dbHost = process.env.DB_HOST || 'localhost'
const dbName = process.env.DB_NAME || 'csc425_practice'
const dbPassword = String(process.env.DB_PASSWORD ?? '')
const dbPort = Number(process.env.DB_PORT) || 5432

console.log('--- Database Config Debug ---')
console.log('DB_USER:', dbUser)
console.log('DB_HOST:', dbHost)
console.log('DB_NAME:', dbName)
console.log('DB_PASSWORD exists:', dbPassword ? 'YES' : 'NO / UNDEFINED')
console.log('----------------------------')

export const pool = new Pool({
  user: dbUser,
  host: dbHost,
  database: dbName,
  password: dbPassword,
  port: dbPort,
})

// Helper function expected by app.js
export async function checkDatabase() {
  try {
    const res = await pool.query('SELECT NOW()')
    return { status: 'connected', dbTime: res.rows[0].now }
  } catch (err) {
    console.error('❌ Database connection check failed:', err.message)
    return { status: 'error', message: err.message }
  }
}
