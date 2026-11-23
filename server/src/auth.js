import crypto from 'node:crypto'
import express from 'express'
import { pool } from './db.js'

// Lab 12: demo sign-in for faculty-only features.
// The browser gets a random token. The database stores only a SHA-256 hash of it,
// so a leaked sessions table does not let anyone sign in.
export const authRouter = express.Router()

const SESSION_HOURS = 8

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex')

// Looks up who is signed in. Every faculty route runs this first.
export async function requireAuth(request, response, next) {
  try {
    const match = /^Bearer ([a-f0-9]{64})$/.exec(request.get('Authorization') ?? '')
    if (!match) return response.status(401).json({ error: 'Sign in to use this feature.' })

    const result = await pool.query(`
      SELECT u.id, u.role, u.faculty_id AS "facultyId", u.student_id AS "studentId",
             COALESCE(f.first_name || ' ' || f.last_name, s.first_name || ' ' || s.last_name) AS name
      FROM student_dashboard.auth_sessions a
      JOIN student_dashboard.app_users u ON u.id = a.user_id
      LEFT JOIN student_dashboard.faculty f ON f.id = u.faculty_id
      LEFT JOIN student_dashboard.students s ON s.id = u.student_id
      WHERE a.token_hash = $1 AND a.expires_at > now() AND u.is_active`, [hashToken(match[1])])
    if (result.rowCount === 0) return response.status(401).json({ error: 'Your sign-in has expired. Sign in again.' })

    request.user = result.rows[0]
    next()
  } catch (error) {
    next(error)
  }
}

// Blocks anyone whose role does not match, even if they are signed in.
export function requireRole(role) {
  return (request, response, next) => {
    if (request.user?.role !== role) {
      return response.status(403).json({ error: `Only ${role} accounts can use this feature.` })
    }
    next()
  }
}

// POST /api/auth/login  { email, password } → 200 { token, user } or 401
authRouter.post('/login', async (request, response, next) => {
  try {
    const { email, password } = request.body ?? {}
    if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
      return response.status(400).json({ error: 'Enter an email and password.' })
    }

    // crypt() re-hashes the typed password with the stored salt and compares.
    const result = await pool.query(`
      SELECT u.id, u.role, COALESCE(f.first_name || ' ' || f.last_name, s.first_name || ' ' || s.last_name) AS name
      FROM student_dashboard.app_users u
      LEFT JOIN student_dashboard.faculty f ON f.id = u.faculty_id
      LEFT JOIN student_dashboard.students s ON s.id = u.student_id
      WHERE u.login_email = lower(btrim($1)) AND u.is_active AND u.password_hash = crypt($2, u.password_hash)`,
    [email, password])
    // The same message for a wrong email or a wrong password, so neither is revealed.
    if (result.rowCount === 0) return response.status(401).json({ error: 'Email or password is incorrect.' })

    const token = crypto.randomBytes(32).toString('hex')
    await pool.query(
      `INSERT INTO student_dashboard.auth_sessions (token_hash, user_id, expires_at)
       VALUES ($1, $2, now() + make_interval(hours => $3))`,
      [hashToken(token), result.rows[0].id, SESSION_HOURS],
    )
    response.json({ token, user: result.rows[0] })
  } catch (error) {
    next(error)
  }
})

// GET /api/auth/me → 200 { user } or 401
authRouter.get('/me', requireAuth, (request, response) => {
  const { id, role, name } = request.user
  response.json({ user: { id, role, name } })
})

// POST /api/auth/logout → 204. The token stops working right away.
authRouter.post('/logout', requireAuth, async (request, response, next) => {
  try {
    const token = request.get('Authorization').slice('Bearer '.length)
    await pool.query('DELETE FROM student_dashboard.auth_sessions WHERE token_hash = $1', [hashToken(token)])
    response.status(204).end()
  } catch (error) {
    next(error)
  }
})

// Database or other unexpected errors during sign-in return JSON, not an HTML page.
// eslint-disable-next-line no-unused-vars
authRouter.use((error, _request, response, _next) => {
  console.error('Sign-in request failed:', error.code || error.name, error.message)
  response.status(503).json({ error: 'Sign-in is unavailable right now. Please try again.' })
})
