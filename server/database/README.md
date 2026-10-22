# Student dashboard database

The student dashboard uses PostgreSQL through Express. The database is not a single file: PostgreSQL maintains a data directory while its server runs. SQL migrations and portable backups belong in this project; copy a completed backup to a drive or sync folder when needed. Do not sync a running PostgreSQL data directory.

## This computer

The existing connection in ignored `server/.env` uses the `student_lookup` database on localhost, port 5432. Its cluster is in `server/local-postgres/data`. Dashboard tables live in the `student_dashboard` schema. The earlier `public.students` exercise is preserved separately; editing dashboard students does not edit that earlier table.

From the project root:

```sh
# Only if this project's PostgreSQL server is stopped:
npm run db:start --prefix server
# Create tables and seed fictional records once; safe to rerun:
npm run db:setup --prefix server
# Start React and Express:
npm run dev
```

Open `http://localhost:5173/#student-dashboard`. Select a student, then use the forms to add, edit, or delete records. The Student lookup form can also select the dashboard student. Refreshing the page reloads saved data from PostgreSQL.

If port 5173 is occupied, use the address printed by Vite (for example, `http://localhost:5174`). All student modules send local requests through Vite's `/api` proxy to `127.0.0.1:3000`, so a different frontend port does not require a CORS change. Start only one backend on port 3000. If you change the backend port, update the proxy target in `client/vite.config.ts` as well.

After stopping the API, `npm run db:stop --prefix server` stops this project's cluster. These scripts never stop an unrelated system PostgreSQL service.

## Another computer

Install PostgreSQL and start its service. Create an empty database named `csc425fa26` with your PostgreSQL administration tool, or run:

```sh
createdb -h localhost -U postgres csc425fa26
```

Copy `server/.env.example` to `server/.env` and set the actual database name, host, port, user, and password. Then run `npm run db:setup --prefix server`. Passwords stay in the backend's ignored `.env`; they never belong in React's `VITE_` settings. For a separate frontend origin, set `CLIENT_ORIGIN` in the server to a comma-separated list of allowed origins and `VITE_API_BASE_URL` in `client/.env.local` to the API base URL.

For production hosting, either route `/api` to Express on the same origin or set `VITE_API_BASE_URL` and the matching backend `CLIENT_ORIGIN` before building. Vite's development proxy is not part of the static build.

If you specifically want a cluster in this project instead of the system service, run these commands from the project root while no server is using port 5432:

```sh
mkdir -p server/local-postgres
initdb -D server/local-postgres/data -U postgres -A scram-sha-256 -W
pg_ctl -D server/local-postgres/data -l server/local-postgres/server.log -o "-h 127.0.0.1 -p 5432" -w start
createdb -h localhost -U postgres csc425fa26
```

Never run `initdb` over an existing data directory. On Windows, use `mkdir server\local-postgres` if needed; use the same forward-slash data paths with PostgreSQL tools. Add PostgreSQL's `bin` directory to PATH, or set `PG_BIN` for the npm helper scripts. On macOS the helpers also detect Postgres.app in either `/Applications` or `~/Applications`.

## Tables and module behavior

| Table | Purpose | Relationships |
| --- | --- | --- |
| `students` | Profile and student selection/lookup | Four-digit student ID |
| `courses` | Course code, title, credit hours | Shared catalog; cannot delete while registered |
| `enrollments` | Student registrations, term, upcoming/completed status, final grade, meeting time and location | Student and course; unique student/course/term |
| `attendance` | Dated present/absent/late/excused records | Registration; unique registration/date |
| `alerts` | Reminder, optional due date, read status | Student |
| `gpa_entries` | Saved equal-weight practice grades | Student; separate from official-style transcript calculations |
| `migrations` | Applied schema version | Setup runs each version only once |

Student deletion removes that student's dependent records. Registration deletion removes its attendance. The UI explains these effects before confirmation. Course deletion is blocked until its registrations are removed. The schema enforces foreign keys, uniqueness, grade values, status/grade consistency, and credit ranges; foreign keys used for lookups are indexed.

Transcript totals are derived from completed registrations and current catalog credit hours. An F counts as attempted credits and earns none. Upcoming registrations have no final grade and do not affect the transcript. Editing a shared course changes every transcript using it. Practice GPA entries use equal weight. Attendance counts present and late as attended, excludes excused dates, and shows `--` when there are no counted dates.

The five original fictional students and their transcript courses are seeded once. Later setup runs preserve edits and deletions. Weather continues to use the existing external weather API because it is a read-only observation, not a student database record.

## Backup to the project or a drive folder

```sh
npm run db:backup --prefix server
# Optional: write to an existing local/synced drive folder using an absolute path:
npm run db:backup --prefix server -- "/absolute/path/to/your/project-drive-folder"
```

The default is `server/database/backups/student-dashboard-TIMESTAMP.dump`. It contains the complete `student_dashboard` schema and records, including migration history; it does not include the earlier `public.students` table, database roles, or credentials. The script uses PostgreSQL's custom dump format and renames the output only after completion. Backups and live database files are ignored by Git. A Google Drive upload requires a chosen destination; no upload is performed automatically.

Restore into a **new, empty** database to avoid overwriting current work:

```sh
createdb -h localhost -U postgres dashboard_restore
pg_restore -h localhost -U postgres -d dashboard_restore --no-owner --no-acl --exit-on-error --single-transaction /absolute/path/student-dashboard-TIMESTAMP.dump
```

Set `DB_NAME=dashboard_restore` in `server/.env`, restart the API, and open `/api/health` and the dashboard. Do not run setup before restoring into an empty database; the backup already contains the tables and migration history. Supply your own port/user/host if different. PostgreSQL tools prompt for passwords as needed.

PostgreSQL documents these portable backups in [SQL Dump](https://www.postgresql.org/docs/current/backup-dump.html).

## Verification and limits

```sh
npm test --prefix server
npm run build
npm run lint
```

API tests create and drop a uniquely named temporary database. The configured database user therefore needs `CREATEDB` for tests. Tests cover all six CRUD resources, ownership, cascades, validation, duplicate conflicts, weighted transcript totals, CORS, and repeatable setup. Tests do not edit the classroom database.

This is a local classroom editor with fictional data and no login/authorization system. It binds to loopback by default. Student selection chooses which records to edit; it is not authentication. Faculty/Admin dashboard features are separate classroom placeholders and are outside this student-dashboard implementation.
