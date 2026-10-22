# Student Dashboard API

Express connects the React student dashboard to PostgreSQL. All student records are fictional classroom data. See [database setup, tables, backups, and restore](database/README.md) for complete instructions.

From the project root, configure `server/.env` using `.env.example`, then:

```sh
npm run db:setup --prefix server
npm run dev
```

The API listens at `http://localhost:3000`. The default is loopback only; this classroom editor has no authentication. React opens at `http://localhost:5173/#student-dashboard`.

## Endpoints

All CRUD collections support `GET` and `POST`. Individual records support `GET`, `PUT`, and `DELETE` at `collection/:id`. `PUT` requires the complete editable record; student IDs cannot be changed. A successful create returns 201 with `{ record }`, update/read returns 200 with `{ record }`, and delete returns 204. Collections return `{ records: [...] }`, except students which preserves `{ students: [...] }`.

| Collection | Editable fields |
| --- | --- |
| `/api/students` | `studentID` (create only), `firstName`, `lastName`, `major` |
| `/api/courses` | `courseCode`, `courseTitle`, `creditHours` |
| `/api/students/:studentID/enrollments` | `courseID`, `term`, `status`, `grade`, `meetingTime`, `location` |
| `/api/students/:studentID/attendance` | `enrollmentID`, `date`, `status` |
| `/api/students/:studentID/alerts` | `message`, `dueDate`, `isRead` |
| `/api/students/:studentID/gpa-entries` | `grade` |

Student IDs contain exactly four digits. Other record IDs and foreign keys are positive integers. Dates use `YYYY-MM-DD`. Alerts accept `null` for no due date. An enrollment has status `upcoming` (no grade) or `completed` (valid letter grade required). Attendance has status `present`, `absent`, `late`, or `excused`.

`GET /api/transcripts/:studentID` and `GET /api/transcripts?studentID=1001` return the existing transcript shape with semesters, courses, credit totals, and weighted GPA calculated from PostgreSQL. Transcript edits happen through course/registration CRUD. `GET /api/health` and `/api/status` check the database and dashboard schema; unavailable storage returns 503, with no mock fallback.

Errors use `{ error, message }`: 400 invalid input; 404 missing record; 409 duplicate or related records preventing deletion; 413 oversized request; 503 database unavailable. Student-scoped queries only read/change rows for the specified student. These checks preserve relationships; they do not establish user identity.

## Source map

- `src/app.js`: routes, response status codes, CORS, error handling.
- `src/dashboardData.js`: validation, parameterized SQL reads, transcript calculations.
- `src/db.js`: backend-only connection pool and environment loading.
- `database/001_dashboard.sql`: table definitions and constraints.
- `database/setup.js`: transactional, versioned initialization and fictional seeds.
- `scripts/backup.js`: portable dashboard schema/data backup.
- `test/transcripts.test.js`: real PostgreSQL/HTTP integration tests in a disposable database.

`CLIENT_ORIGIN` controls browser origins (defaults to localhost and 127.0.0.1 on port 5173). Run `npm test --prefix server`, `npm run build`, and `npm run lint` from the root to verify changes.
