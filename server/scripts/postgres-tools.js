import { existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import '../src/db.js'

export function postgresTool(name) {
  const executable = process.platform === 'win32' ? `${name}.exe` : name
  const folders = [process.env.PG_BIN,
    join(homedir(), 'Applications/Postgres.app/Contents/Versions/latest/bin'),
    '/Applications/Postgres.app/Contents/Versions/latest/bin',
  ].filter(Boolean)
  return folders.map((folder) => join(folder, executable)).find(existsSync) || executable
}
export function runPostgres(name, args, extraEnvironment = {}) {
  const result = spawnSync(postgresTool(name), args, { stdio: 'inherit', env: { ...process.env,
    PGHOST: process.env.DB_HOST || 'localhost', PGPORT: process.env.DB_PORT || '5432',
    PGDATABASE: process.env.DB_NAME || 'csc425fa26', PGUSER: process.env.DB_USER || 'postgres',
    PGPASSWORD: process.env.DB_PASSWORD || '', ...extraEnvironment,
  } })
  if (result.error) throw new Error(`Cannot run ${name}. Install PostgreSQL or set PG_BIN to its bin directory.`)
  if (result.status !== 0) throw new Error(`${name} exited with status ${result.status}.`)
}
