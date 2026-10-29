import assert from 'node:assert/strict'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { chromium } from 'playwright'
import { pool } from '../src/db.js'

const baseURL = process.env.BROWSER_URL || 'http://localhost:5173'
let browser
try {
  const { rows: students } = await pool.query(`SELECT id, first_name, last_name
    FROM student_dashboard.students ORDER BY id`)
  assert.ok(students.length > 0, 'Seed student and transcript data before this check.')
  browser = await chromium.launch({ headless: true, channel: process.env.BROWSER_CHANNEL || 'chrome' })
  const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } })
  page.setDefaultTimeout(15000)
  page.setDefaultNavigationTimeout(15000)
  const errors = []
  const requests = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('request', (request) => {
    if (/\/api\/(students|transcripts)/.test(request.url())) requests.push(request.url())
  })
  await page.goto(`${baseURL}/#student-dashboard`)
  await page.getByRole('heading', { name: 'Student Dashboard', exact: true }).waitFor()
  await page.getByRole('heading', { name: 'GPA Calculator', exact: true }).waitFor()
  assert.equal(await page.locator('#alerts, #courses, a[href="#alerts"], a[href="#courses"]').count(), 0)
  const lookup = page.locator('#student-lookup')
  const transcript = page.locator('#transcript')
  assert.equal(await transcript.locator('.transcript-card-record').count(), 0)
  for (const student of students) {
    const fullName = `${student.first_name} ${student.last_name}`
    await lookup.getByLabel('Student full name', { exact: true }).fill(`  ${fullName.toUpperCase().replace(' ', '   ')}  `)
    await lookup.getByRole('button', { name: 'Search', exact: true }).click()
    await lookup.locator('.student-lookup-result').waitFor()
    assert.equal(await lookup.locator('dd').first().innerText(), String(student.id))
    await transcript.getByLabel('Student First Last Name', { exact: true }).fill(fullName)
    const [response] = await Promise.all([
      page.waitForResponse((response) => response.url().includes('/api/transcripts?')),
      transcript.getByRole('button', { name: 'Search', exact: true }).click(),
    ])
    assert.equal(response.status(), 200)
    const data = await response.json()
    assert.equal(data.studentID, String(student.id))
    await transcript.getByRole('heading', { name: fullName, exact: true }).waitFor()
    assert.equal(await transcript.locator('.transcript-card-summary dd').first().innerText(), data.summary.cumulativeGPA.toFixed(2))
    assert.equal(await transcript.locator('tbody tr').count(), data.semesters.reduce((sum, term) => sum + term.courses.length, 0))
    console.log(`Verified database → API → lookup and transcript UI for student #${student.id}.`)
  }
  for (const [section, label] of [[lookup, 'Student full name'], [transcript, 'Student First Last Name']]) {
    await section.getByLabel(label, { exact: true }).fill('No Such Student In Database')
    await section.getByRole('button', { name: 'Search', exact: true }).click()
    await section.getByRole('alert').filter({ hasText: 'Student not found' }).waitFor()
    assert.equal(await section.locator('.student-lookup-result, .transcript-card-record').count(), 0)
    const before = requests.length
    await section.getByLabel(label, { exact: true }).fill(' ')
    await section.getByRole('button', { name: 'Search', exact: true }).click()
    await section.getByRole('alert').filter({ hasText: 'before searching' }).waitFor()
    assert.equal(requests.length, before, 'Blank searches must not send requests.')
  }
  await transcript.getByLabel('Student First Last Name', { exact: true }).fill(`${students[0].first_name} ${students[0].last_name}`)
  await transcript.getByRole('button', { name: 'Search', exact: true }).click()
  await transcript.locator('.transcript-card-record').waitFor()
  await page.setViewportSize({ width: 390, height: 844 })
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true)
  await transcript.screenshot({ path: join(tmpdir(), 'student-transcript-mobile.png') })
  assert.deepEqual(errors, [])
  console.log(`Passed ${students.length} student searches, name validation, stale-result clearing, removed modules, GPA title, and mobile layout; no uncaught browser errors.`)
} finally {
  await browser?.close()
  await pool.end()
}
