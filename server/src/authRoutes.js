
/**
 * Authentication routes for logging in, logging out,
 * and checking the current user.
 */

import { Router } from 'express'
import bcrypt from 'bcrypt'
import { pool } from './db.js'

export const authRouter = Router()

// Find a user using the existing authentication tables.
async function findUser(email) {
  const result = await pool.query(
    `SELECT u.id, u.email, u.password_hash, u.faculty_id,
            u.is_active, r.name AS role
     FROM auth.users u
     JOIN auth.roles r ON u.role_id = r.id
     WHERE LOWER(u.email) = LOWER($1)`,
    [email]
  )

  return result.rows[0]
}

// Look up the user on each request instead of trusting the browser.
export async function loadSessionUser(request, response, next){
  if (!request.session.userId) {
    return next()
  }

  try {
    const result = await pool.query(
      `SELECT u.id, u.email, u.faculty_id, r.name AS role
       FROM auth.users u
       JOIN auth.roles r ON u.role_id = r.id
       WHERE u.id = $1 AND u.is_active = TRUE`,
      [request.session.userId]
    )

    request.user = result.rows[0]

    if (!request.user) {
      request.session.userId = null
    }

    next()
  } catch (error) {
    next(error)
  }
}

// Log in with an email and password.
authRouter.post('/login', async (request, response, next) => {
  try {
    const { email, password } = request.body ?? {}

    if (typeof email !== 'string' || typeof password !== 'string' ||
        !email.trim() || !password) {
      return response.status(400).json({
        error: 'Email and password are required',
      })
    }

    const user = await findUser(email.trim())

    if (!user || !user.is_active ||
        !(await bcrypt.compare(password, user.password_hash))) {
      return response.status(401).json({
        error: 'Invalid email or password',
      })
    }

    // Create a fresh session after successful authentication.
    request.session.regenerate((error) => {
      if (error) return next(error)

      request.session.userId = user.id

      request.session.save((saveError) => {
        if (saveError) return next(saveError)

        response.json({
          message: 'Login successful',
          user: {
            id: user.id,
            email: user.email,
            role: user.role,
            facultyId: user.faculty_id,
          },
        })
      })
    })
  } catch (error) {
    next(error)
  }
})

// End the current session.
authRouter.post('/logout', (request, response, next) => {
  request.session.destroy((error) => {
    if (error) return next(error)

    response.clearCookie('connect.sid', { path: '/' })
    response.json({ message: 'Logged out successfully' })
  })
})

// Return the authenticated user's information.
authRouter.get('/me', (request, response) => {
  if (!request.user) {
    return response.status(401).json({
      error: 'Authentication required',
    })
  }

  response.json({
    user: {
      id: request.user.id,
      email: request.user.email,
      role: request.user.role,
      facultyId: request.user.faculty_id,
    },
  })
})
