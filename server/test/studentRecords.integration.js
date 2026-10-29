import assert from 'node:assert/strict'
import { once } from 'node:events'
import { readFile } from 'node:fs/promises'
import { after, before, test } from 'node:test'
import express from 'express'
import pg from 'pg'
import { databaseConfig, pool } from '../src/db.js'
import { createStudentRecordsRouter } from '../src/studentRecordsRoutes.js'

// Real PostgreSQL, isolated from student data. Only this generated DB is dropped.
const name = `csc425_crud_test_${process.pid}_${Date.now()}`
const admin = new pg.Pool(databaseConfig)
let database
let server
let baseURL
let created = false

before(async () => {
  await admin.query(`CREATE DATABASE "${name}"`)
  created = true
  database = new pg.Pool({ ...databaseConfig, database: name })
  for (const file of ['001_student_records.sql', '002_sample_inserts.sql']) {
    await database.query(await readFile(new URL(`../database/${file}`, import.meta.url), 'utf8'))
  }
  const app = express()
  app.use('/api/dashboard', createStudentRecordsRouter(database))
  server = app.listen(0, '127.0.0.1')
  await once(server, 'listening')
  baseURL = `http://127.0.0.1:${server.address().port}/api/dashboard`
})

after(async () => {
  if (server?.listening) await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
  await database?.end()
  if (created) await admin.query(`DROP DATABASE "${name}" WITH (FORCE)`)
  await admin.end()
  await pool.end()
})

function request(path, method = 'GET', body) {
  return fetch(`${baseURL}${path}`, {
    method, headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
}

const input = { firstName: 'Casey', lastName: 'Rivera', email: 'casey.rivera@example.test', majorId: 1, enrollmentYear: 2026, isActive: true }

test('manual inserts persist and students join to their majors', async () => {
  const direct = await database.query(`SELECT s.email, m.code FROM student_dashboard.students s
    JOIN student_dashboard.majors m ON m.id = s.major_id ORDER BY s.id`)
  assert.deepEqual(direct.rows, [
    { email: 'avery.morgan@example.test', code: 'CSC' },
    { email: 'jordan.bennett@example.test', code: 'CIS' },
    { email: 'taylor.reed@example.test', code: 'MAT' },
  ])
  assert.equal((await (await request('/majors')).json()).majors.length, 3)
  assert.equal((await (await request('/students')).json()).students.length, 3)
})

test('create, retrieve, update, retrieve, delete, and verify directly in PostgreSQL', async () => {
  const createdResponse = await request('/students', 'POST', { ...input, email: 'CASEY.RIVERA@EXAMPLE.TEST' })
  assert.equal(createdResponse.status, 201)
  const { student } = await createdResponse.json()
  assert.equal(createdResponse.headers.get('location'), `/api/dashboard/students/${student.id}`)
  assert.equal(student.email, input.email)
  assert.equal(student.majorName, 'Computer Science')
  assert.equal((await database.query('SELECT email FROM student_dashboard.students WHERE id = $1', [student.id])).rows[0].email, input.email)
  assert.deepEqual((await (await request(`/students/${student.id}`)).json()).student, student)

  const edited = { ...input, lastName: 'Rivera-Santos', majorId: 2, enrollmentYear: 2025, isActive: false }
  const updatedResponse = await request(`/students/${student.id}`, 'PUT', edited)
  assert.equal(updatedResponse.status, 200)
  const updated = (await updatedResponse.json()).student
  assert.equal(updated.majorName, 'Information Systems')
  assert.equal(updated.createdAt, student.createdAt)
  assert.notEqual(updated.updatedAt, student.updatedAt)
  assert.deepEqual((await (await request(`/students/${student.id}`)).json()).student, updated)
  const direct = await database.query('SELECT last_name, major_id, enrollment_year, is_active FROM student_dashboard.students WHERE id = $1', [student.id])
  assert.deepEqual(direct.rows, [{ last_name: edited.lastName, major_id: 2, enrollment_year: 2025, is_active: false }])

  assert.equal((await request(`/students/${student.id}`, 'DELETE')).status, 204)
  assert.equal((await request(`/students/${student.id}`)).status, 404)
  assert.equal((await database.query('SELECT id FROM student_dashboard.students WHERE id = $1', [student.id])).rowCount, 0)
  assert.ok(!(await (await request('/students')).json()).students.some((row) => row.id === student.id))
  assert.equal((await request(`/students/${student.id}`, 'PUT', edited)).status, 404)
  assert.equal((await request(`/students/${student.id}`, 'DELETE')).status, 404)
})

test('API rejects invalid fields, malformed JSON, duplicate emails, and missing majors', async () => {
  for (const change of [{ firstName: ' ' }, { lastName: 'x'.repeat(61) }, { email: 'invalid' },
    { enrollmentYear: 1999 }, { enrollmentYear: 2026.5 }, { isActive: 'false' }, { majorId: 0 },
    { majorId: '1' }, { id: 45 }]) {
    assert.equal((await request('/students', 'POST', { ...input, ...change })).status, 400)
  }
  for (const id of ['0', '-1', 'abc', '1 OR 1=1', '2147483648']) {
    assert.equal((await request(`/students/${encodeURIComponent(id)}`)).status, 400)
  }
  assert.equal((await request('/students', 'POST', { ...input, email: 'AVERY.MORGAN@EXAMPLE.TEST' })).status, 409)
  assert.equal((await request('/students', 'POST', { ...input, majorId: 2147483647 })).status, 409)
  assert.equal((await request('/students/1', 'PUT', { ...input, email: 'jordan.bennett@example.test' })).status, 409)
  assert.equal((await request('/students/1', 'PUT', { ...input, majorId: 2147483647 })).status, 409)
  const malformed = await fetch(`${baseURL}/students`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{' })
  assert.equal(malformed.status, 400)
  assert.equal((await malformed.json()).error, 'INVALID_JSON')
  const oversized = await request('/students', 'POST', { ...input, firstName: 'x'.repeat(17000) })
  assert.equal(oversized.status, 413)
})

test('database enforces constraints even when bypassing Express', async () => {
  await assert.rejects(database.query('DELETE FROM student_dashboard.majors WHERE id = 1'),
    (error) => ['23503', '23001'].includes(error.code))
  await assert.rejects(database.query('UPDATE student_dashboard.students SET enrollment_year = 1800 WHERE id = 1'), { code: '23514' })
  await assert.rejects(database.query('UPDATE student_dashboard.students SET first_name = NULL WHERE id = 1'), { code: '23502' })
  await assert.rejects(database.query("UPDATE student_dashboard.students SET email = 'jordan.bennett@example.test' WHERE id = 1"), { code: '23505' })
  await assert.rejects(database.query('UPDATE student_dashboard.students SET major_id = 2147483647 WHERE id = 1'), { code: '23503' })
})
