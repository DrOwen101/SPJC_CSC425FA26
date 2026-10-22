import { mkdir, rename, rm } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { join, resolve } from 'node:path'
import { runPostgres } from './postgres-tools.js'

const folder = process.argv[2] ? resolve(process.argv[2]) : fileURLToPath(new URL('../database/backups/', import.meta.url))
const stamp = new Date().toISOString().replace(/[:.]/g, '-')
const destination = join(folder, `student-dashboard-${stamp}.dump`)
try {
  await mkdir(folder, { recursive: true, mode: 0o700 })
  // Publish only a completed backup, so a sync folder never receives a partial dump.
  runPostgres('pg_dump', ['--format=custom', '--no-owner', '--no-acl', '--schema=student_dashboard', '--file', `${destination}.partial`])
  await rename(`${destination}.partial`, destination)
  console.log(`Dashboard backup saved: ${destination}`)
} catch (error) {
  await rm(`${destination}.partial`, { force: true })
  console.error(error.message)
  process.exitCode = 1
}
