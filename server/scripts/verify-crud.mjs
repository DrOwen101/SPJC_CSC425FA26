// Real PostgreSQL integration check; creates and deletes its own fictional row.
import 'dotenv/config'
import assert from 'node:assert/strict'
import { once } from 'node:events'
import { app } from '../src/app.js'
import { pool } from '../src/db.js'

const server = app.listen(0, '127.0.0.1')
await once(server, 'listening')
const base = `http://127.0.0.1:${server.address().port}/api/dashboard/students`
const email = `crud-check-${Date.now()}@example.com`
let id
try {
  const { rows: majors } = await pool.query('SELECT id FROM student_dashboard.majors ORDER BY id LIMIT 1')
  assert.ok(majors.length, 'Run schema and sample SQL first')
  const payload = { firstName: 'Integration', lastName: 'Fiction', email, majorId: majors[0].id, enrollmentYear: 2026, isActive: true }
  const create = await fetch(base, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
  assert.equal(create.status, 201)
  id = (await create.json()).student.id
  assert.equal((await pool.query('SELECT email FROM student_dashboard.students WHERE id = $1', [id])).rows[0].email, email)
  assert.equal((await (await fetch(`${base}/${id}`)).json()).student.id, id)
  const update = await fetch(`${base}/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...payload, lastName: 'Edited', isActive: false }) })
  assert.equal(update.status, 200)
  const stored = (await pool.query('SELECT last_name, is_active FROM student_dashboard.students WHERE id = $1', [id])).rows[0]
  assert.deepEqual(stored, { last_name: 'Edited', is_active: false })
  assert.equal((await (await fetch(`${base}/${id}`)).json()).student.lastName, 'Edited')
  const duplicate = await fetch(base, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
  assert.equal(duplicate.status, 409)
  const invalidMajor = await fetch(base, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...payload, email: `fk-${email}`, majorId: 2147483647 }) })
  assert.equal(invalidMajor.status, 400)
  await assert.rejects(pool.query('DELETE FROM student_dashboard.majors WHERE id = $1', [majors[0].id]),
    (error) => ['23503', '23001'].includes(error.code))
  const deleted = await fetch(`${base}/${id}`, { method: 'DELETE' })
  assert.equal(deleted.status, 200)
  assert.equal((await deleted.json()).deletedId, id)
  assert.equal((await fetch(`${base}/${id}`)).status, 404)
  assert.equal((await pool.query('SELECT id FROM student_dashboard.students WHERE id = $1', [id])).rowCount, 0)
  console.log(`PASS: PostgreSQL create/read/update/delete for student ${id}; duplicate email, FK restriction, invalid major, and missing record verified.`)
} finally {
  // Delete only this check's uniquely named fictional row, even after a failure.
  await pool.query('DELETE FROM student_dashboard.students WHERE email = $1', [email])
  await new Promise((resolve) => server.close(resolve))
  await pool.end()
}
