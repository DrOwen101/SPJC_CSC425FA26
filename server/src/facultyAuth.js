import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'

export const derivePasswordHash = promisify(scrypt)
const sessionDuration = 4 * 60 * 60 * 1000
const loginWindow = 60 * 1000

export function createFacultyAuth(db) {
  const sessions = new Map()
  const attempts = new Map()
  const dummySalt = randomBytes(16).toString('hex')
  const dummyHash = randomBytes(64)

  function authenticate(req, res, next) {
    const token = req.get('Authorization')?.match(/^Bearer ([a-f0-9]{64})$/i)?.[1]
    const session = sessions.get(token)
    if (!session || session.expiresAt <= Date.now()) {
      sessions.delete(token)
      return res.status(401).json({ message: 'Sign in to continue.' })
    }
    req.labSession = session
    req.labToken = token
    next()
  }

  async function signIn(req, res) {
    const username = typeof req.body?.username === 'string' ? req.body.username.trim().toLowerCase() : ''
    const password = req.body?.password
    if (!username || username.length > 64 || typeof password !== 'string' || !password || password.length > 128) {
      return res.status(400).json({ message: 'Enter a valid username and password.' })
    }

    const now = Date.now()
    for (const [address, attempt] of attempts) {
      if (attempt.until <= now) attempts.delete(address)
    }
    const attempt = attempts.get(req.ip) ?? { count: 0, until: now + loginWindow }
    if (attempt.count >= 8) {
      return res.status(429).json({ message: 'Too many sign-in attempts. Wait a minute and try again.' })
    }
    attempts.set(req.ip, { ...attempt, count: attempt.count + 1 })

    const { rows: [account] } = await db.query(`
      SELECT id, role, display_name AS "displayName", password_salt, password_hash
      FROM faculty_dashboard.accounts WHERE username = $1
    `, [username])
    const actual = await derivePasswordHash(password, account?.password_salt ?? dummySalt, 64)
    const expected = account ? Buffer.from(account.password_hash, 'hex') : dummyHash
    if (!timingSafeEqual(actual, expected) || !account) {
      return res.status(401).json({ message: 'Username or password is incorrect.' })
    }

    attempts.delete(req.ip)
    for (const [token, session] of sessions) {
      if (session.expiresAt <= now || session.id === account.id) sessions.delete(token)
    }
    const token = randomBytes(32).toString('hex')
    const user = { role: account.role, displayName: account.displayName }
    sessions.set(token, { id: account.id, ...user, expiresAt: now + sessionDuration })
    return res.json({ token, user })
  }

  function signOut(req, res) {
    sessions.delete(req.labToken)
    res.sendStatus(204)
  }

  function requireFaculty(req, res, next) {
    if (req.labSession.role !== 'faculty') {
      return res.status(403).json({ message: 'A faculty account is required.' })
    }
    next()
  }

  return { signIn, signOut, authenticate, requireFaculty }
}
