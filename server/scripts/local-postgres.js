import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { runPostgres } from './postgres-tools.js'

// Use only this project's existing cluster. Never stop a machine-wide service.
const data = fileURLToPath(new URL('../local-postgres/data', import.meta.url))
const log = fileURLToPath(new URL('../local-postgres/server.log', import.meta.url))
const command = process.argv[2]
try {
  if (!existsSync(`${data}/PG_VERSION`)) throw new Error('No project-local cluster exists. Follow server/database/README.md to initialize one, or start your installed PostgreSQL service.')
  if (command === 'start') runPostgres('pg_ctl', ['-D', data, '-l', log, '-w', 'start'])
  else if (command === 'stop') runPostgres('pg_ctl', ['-D', data, '-m', 'fast', '-w', 'stop'])
  else throw new Error('Use start or stop.')
} catch (error) { console.error(error.message); process.exitCode = 1 }
