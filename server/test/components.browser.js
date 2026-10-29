import assert from 'node:assert/strict'
import { writeFile, unlink } from 'node:fs/promises'
import { chromium } from 'playwright'

// Serve a temporary consumer through Vite, with two instances of every module.
// This checks actual reuse without adding a demo page to the application.
const filename = `.component-check-${process.pid}.jsx`
const fixture = new URL(`../../client/${filename}`, import.meta.url)
const baseURL = process.env.BROWSER_URL || 'http://localhost:5173'
let browser
try {
  await writeFile(fixture, `
import React from 'react'
import { createRoot } from 'react-dom/client'
import StudentRecords from './src/StudentRecords'
import AllStudents from './src/AllStudents'
import StudentLookup from './src/StudentLookup'
import WeatherCard from './src/WeatherCard'
import GpaCalculator from './src/GpaCalculator'
import TranscriptCard from './src/TranscriptCard'
const host = document.createElement('div')
host.id = 'reuse-check'
document.body.append(host)
createRoot(host).render(<>{[0, 1].map(index => <div key={index} data-copy={index}>
<StudentRecords /><AllStudents /><StudentLookup /><WeatherCard /><GpaCalculator /><TranscriptCard />
</div>)}</>)
`)
  browser = await chromium.launch({ headless: true, channel: process.env.BROWSER_CHANNEL || 'chrome' })
  const page = await browser.newPage()
  page.setDefaultTimeout(15000)
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  // A deterministic weather response verifies independent card state; no claim
  // about the external provider's live response is made by this test.
  await page.route('https://api.open-meteo.com/**', (route) => route.fulfill({
    contentType: 'application/json', body: JSON.stringify({ current: { temperature_2m: 28.5 } }),
  }))
  await page.goto(`${baseURL}/#center`)
  await page.evaluate(async (name) => { await import(`/${name}`) }, filename)
  const copies = page.locator('#reuse-check > div')
  for (let index = 0; index < 2; index++) {
    const copy = copies.nth(index)
    await copy.locator('.student-records').getByRole('status').filter({ hasText: 'Student records loaded.' }).waitFor()
    await copy.locator('.all-students').getByRole('status').filter({ hasText: 'Student records loaded.' }).waitFor()
    await copy.locator('.weather-card-temperature').filter({ hasText: '28.5 °C' }).waitFor()
    assert.equal(await copy.locator(':scope > section').count(), 6)
  }
  const ids = await page.locator('[id]').evaluateAll((nodes) => nodes.map((node) => node.id))
  assert.equal(new Set(ids).size, ids.length, 'Multiple component instances must have unique IDs.')
  const brokenLabels = await page.locator('#reuse-check label').evaluateAll((labels) => labels.filter((label) => !label.control).length)
  assert.equal(brokenLabels, 0)
  const first = copies.nth(0)
  const second = copies.nth(1)
  const gpa = first.locator('.gpa-calculator')
  for (const grade of ['A', 'B']) {
    await gpa.getByLabel('Enter a letter grade').fill(grade)
    await gpa.getByRole('button', { name: 'Add Grade', exact: true }).click()
  }
  await gpa.getByRole('button', { name: 'Calculate GPA', exact: true }).click()
  assert.equal(await gpa.locator('.metric').innerText(), '3.50')
  assert.equal(await second.locator('.gpa-calculator .metric').innerText(), '--')
  await first.locator('.all-students summary').click()
  assert.equal(await first.locator('.all-students table').isVisible(), false)
  assert.equal(await second.locator('.all-students table').isVisible(), true)
  await first.locator('.all-students summary').focus()
  await page.keyboard.press('Enter')
  assert.equal(await first.locator('.all-students table').isVisible(), true)
  await first.locator('.student-records').getByLabel('First name', { exact: true }).fill('Independent')
  assert.equal(await second.locator('.student-records').getByLabel('First name', { exact: true }).inputValue(), '')
  assert.deepEqual(errors, [])
  console.log('All six components rendered outside the dashboard, twice: unique IDs, associated labels, independent editor/GPA/collapse state; deterministic weather response.')
} finally {
  await browser?.close()
  await unlink(fixture)
}
