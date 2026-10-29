import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { chromium } from 'playwright'
import { pool } from '../src/db.js'

// Start Express and Vite first, both using the same database as server/.env.
// Only this run's uniquely named fictional student is created and removed.
const email = `casey.crud.${Date.now()}@example.test`
const baseURL = process.env.BROWSER_URL || 'http://localhost:5173'
const evidenceDirectory = process.env.CRUD_EVIDENCE_DIR
const report = { database: null, studentId: null, email, checks: [], requests: [] }
let browser

try {
  report.database = (await pool.query('SELECT current_database() AS name')).rows[0].name
  const majors = (await pool.query('SELECT id FROM student_dashboard.majors ORDER BY id')).rows
  assert.ok(majors.length >= 2, 'Run db:setup before the browser test.')
  browser = await chromium.launch({ headless: true, channel: process.env.BROWSER_CHANNEL || 'chrome' })
  const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } })
  page.setDefaultTimeout(15000)
  page.setDefaultNavigationTimeout(15000)
  const pageErrors = []
  page.on('pageerror', (error) => pageErrors.push(error.message))
  page.on('response', (response) => {
    if (response.url().includes('/api/dashboard/')) {
      report.requests.push({ method: response.request().method(), path: new URL(response.url()).pathname, status: response.status() })
    }
  })
  const section = page.locator('#student-records')
  const list = page.locator('#all-students')
  async function loaded() {
    await section.getByRole('status').filter({ hasText: 'Student records loaded.' }).waitFor()
    await list.getByRole('status').filter({ hasText: 'Student records loaded.' }).waitFor()
  }
  async function retrieve(id) {
    await section.getByLabel('Student record ID', { exact: true }).fill(String(id))
    await section.getByRole('button', { name: 'Retrieve by ID' }).click()
    await section.getByRole('status').filter({ hasText: `Retrieved student #${id} from the database.` }).waitFor()
  }
  async function saveWith(button, method) {
    const [response] = await Promise.all([
      page.waitForResponse((response) => response.url().includes('/api/dashboard/students') && response.request().method() === method),
      section.getByRole('button', { name: button, exact: true }).click(),
    ])
    assert.equal(response.status(), method === 'POST' ? 201 : 200)
    return (await response.json()).student
  }

  await page.goto(`${baseURL}/#student-records`)
  await loaded()
  console.log('Dashboard loaded; creating the test student.')
  await section.getByLabel('First name', { exact: true }).fill('Casey')
  await section.getByLabel('Last name', { exact: true }).fill('Rivera')
  await section.getByLabel('Email', { exact: true }).fill(email)
  await section.getByLabel('Major', { exact: true }).selectOption(String(majors[0].id))
  await section.getByLabel('Enrollment year', { exact: true }).fill('2026')
  const student = await saveWith('Create student', 'POST')
  report.studentId = student.id
  await section.getByRole('heading', { name: `Edit student #${student.id}`, exact: true }).waitFor()
  const created = (await pool.query('SELECT id, first_name, last_name, email FROM student_dashboard.students WHERE id = $1', [student.id])).rows
  assert.deepEqual(created, [{ id: student.id, first_name: 'Casey', last_name: 'Rivera', email }])
  report.checks.push({ step: 'Create through dashboard; verify directly in PostgreSQL', rows: created })
  await list.getByRole('cell', { name: email, exact: false }).waitFor()
  await list.getByRole('button', { name: `View student ${student.id}`, exact: true }).click()
  await section.getByRole('status').filter({ hasText: `Retrieved student #${student.id} from the database.` }).waitFor()
  console.log(`Created student #${student.id}; database row, list refresh, and View selection verified.`)

  await page.reload()
  await loaded()
  await retrieve(student.id)
  assert.ok((await section.locator('.records-saved').innerText()).includes(email))
  report.checks.push({ step: 'Reload page and retrieve the same ID through Axios', result: 'passed' })

  await section.getByLabel('Last name', { exact: true }).fill('Rivera-Santos')
  await section.getByLabel('Major', { exact: true }).selectOption(String(majors[1].id))
  await section.getByLabel('Enrollment year', { exact: true }).fill('2025')
  await section.getByLabel('Active student', { exact: true }).uncheck()
  await saveWith('Save changes', 'PUT')
  await section.getByRole('status').filter({ hasText: `Updated student #${student.id}.` }).waitFor()
  const edited = (await pool.query('SELECT id, last_name, major_id, enrollment_year, is_active FROM student_dashboard.students WHERE id = $1', [student.id])).rows
  assert.deepEqual(edited, [{ id: student.id, last_name: 'Rivera-Santos', major_id: majors[1].id, enrollment_year: 2025, is_active: false }])
  report.checks.push({ step: 'Edit through dashboard; verify directly in PostgreSQL', rows: edited })
  await list.getByRole('cell', { name: `Casey Rivera-Santos ${email}`, exact: false }).waitFor()
  console.log(`Updated student #${student.id}; database values and list refresh verified.`)

  await page.reload()
  await loaded()
  await retrieve(student.id)
  assert.equal(await section.getByLabel('Last name', { exact: true }).inputValue(), 'Rivera-Santos')
  assert.equal(await section.getByLabel('Enrollment year', { exact: true }).inputValue(), '2025')
  assert.equal(await section.getByLabel('Major', { exact: true }).inputValue(), String(majors[1].id))
  assert.equal(await section.getByLabel('Active student', { exact: true }).isChecked(), false)
  report.checks.push({ step: 'Reload and retrieve edited values through dashboard', result: 'passed' })
  if (evidenceDirectory) {
    await mkdir(evidenceDirectory, { recursive: true })
    await section.screenshot({ path: join(evidenceDirectory, 'student-records-desktop.png') })
  }
  await page.setViewportSize({ width: 390, height: 844 })
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true)
  if (evidenceDirectory) await section.screenshot({ path: join(evidenceDirectory, 'student-records-mobile.png') })
  report.checks.push({ step: 'Mobile layout at 390px: no page overflow', result: 'passed' })

  await section.getByRole('button', { name: 'Delete record', exact: true }).click()
  await section.getByRole('button', { name: 'Cancel delete', exact: true }).click()
  assert.equal((await pool.query('SELECT id FROM student_dashboard.students WHERE id = $1', [student.id])).rowCount, 1)
  await section.getByRole('button', { name: 'Delete record', exact: true }).click()
  await section.getByRole('button', { name: 'Confirm delete', exact: true }).click()
  await section.getByRole('status').filter({ hasText: `Deleted student #${student.id}.` }).waitFor()
  const removed = await pool.query('SELECT id FROM student_dashboard.students WHERE id = $1', [student.id])
  assert.equal(removed.rowCount, 0)
  await section.getByRole('button', { name: 'Retrieve by ID', exact: true }).click()
  await section.getByRole('alert').filter({ hasText: 'Student not found.' }).waitFor()
  assert.equal(await section.locator('.records-saved').count(), 0)
  await list.getByRole('button', { name: 'Refresh list', exact: true }).click()
  await list.getByRole('status').filter({ hasText: 'Student records loaded.' }).waitFor()
  assert.ok(!(await list.locator('tbody').innerText()).includes(email))
  await page.reload()
  await loaded()
  assert.ok(!(await list.locator('tbody').innerText()).includes(email))
  report.checks.push({ step: 'Delete through dashboard; database has zero rows; retrieval returns 404; refreshed UI excludes record', rowCount: removed.rowCount })
  assert.deepEqual(pageErrors, [])
  report.checks.push({ step: 'Browser uncaught JavaScript errors', count: pageErrors.length })
  if (evidenceDirectory) await writeFile(join(evidenceDirectory, 'browser-verification.json'), `${JSON.stringify(report, null, 2)}\n`)
  console.log(JSON.stringify(report, null, 2))
} finally {
  await browser?.close()
  try { await pool.query('DELETE FROM student_dashboard.students WHERE email = $1', [email]) }
  finally { await pool.end() }
}
