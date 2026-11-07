# Lab 10 PostgreSQL student records

This lab connects the Student Dashboard to real PostgreSQL CRUD through Axios and Express. The new **Student records** section is separate from the earlier mock lookup and transcript exercises.

## Run from a fresh checkout

Requirements: Node.js 22.12+ (Node 24 was used), npm, PostgreSQL, and `psql` on PATH. Start your local PostgreSQL service first. Open PowerShell at the repository root.

```powershell
npm ci
npm ci --prefix server
npm ci --prefix client
if (-not (Test-Path server/.env)) { Copy-Item server/.env.example server/.env }
if (-not (Test-Path client/.env.local)) { Copy-Item client/.env.example client/.env.local }
```

Edit `server/.env` with your local PostgreSQL credentials and `DB_NAME=csc425_practice`. Keep it private. `client/.env.local` contains only the public API address, `VITE_API_BASE_URL=http://localhost:3000`. Restart Vite when changing that value. Never put database credentials in frontend variables.

If the database does not exist yet, run this once (skip it for an existing database):

```powershell
createdb -h localhost -U postgres csc425_practice
```

Create the schema and manually insert the fictional examples using the SQL CLI:

```powershell
psql -h localhost -U postgres -d csc425_practice -v ON_ERROR_STOP=1 -f server/sql/01-schema.sql -f server/sql/02-sample-inserts.sql
```

These scripts do not drop tables. They are repeatable for this initial schema and do not overwrite existing sample rows. They are not a general migration system for later schema changes. The final SELECT prints the saved fictional students and their majors before dashboard entry.

If you are already inside `psql` at `csc425_practice=#`, use these commands instead:

```sql
\i C:/Users/impoh/Documents/CSC425/SPJC_CSC425FA26/server/sql/01-schema.sql
\i C:/Users/impoh/Documents/CSC425/SPJC_CSC425FA26/server/sql/02-sample-inserts.sql
\dt student_dashboard.*
\d student_dashboard.students
```

The tables are in the `student_dashboard` schema; plain `\dt` may omit them because of the default search path. SQL statements end with a semicolon. The `\i`, `\dt`, and `\d` psql commands do not need one.

Start the app:

```powershell
npm run dev
```

Open `http://localhost:3000/api/health` (database connected), then `http://localhost:5173/#student-records`. The backend permits dashboard browser requests from `http://localhost:5173`; use that hostname and port. Run only one backend on port 3000 and one frontend on 5173. The existing root dev script runs both; alternatively use separate terminals with `npm run dev --prefix server` and `npm run dev --prefix client`.

## Relational design

`student_dashboard.majors.id` is the parent primary key. `student_dashboard.students.id` is a separate generated primary key. Each student's required `major_id` references an existing major, so many students can belong to one major. `ON DELETE RESTRICT` protects a major referenced by a student. PostgreSQL enforces foreign keys automatically.

Both tables use integer identities. Names and emails have length limits and nonblank/format checks; emails are lowercase and unique. Enrollment year is a small integer limited to 1900-2100. Active status is boolean. Creation and update times use time zones. `students_major_id_idx` supports joins. All names and `example.com` emails in the SQL and database demonstration are fictional.

## Code map

| File | Responsibility |
| --- | --- |
| `server/sql/01-schema.sql` | Related tables, primary/foreign keys, constraints and index |
| `server/sql/02-sample-inserts.sql` | Manual fictional SQL inserts and direct JOIN query |
| `server/sql/03-verify.sql` | Repeatable queries for one dashboard ID |
| `server/src/db.js` | One shared pg Pool, timeouts and idle-connection error handling |
| `server/src/dashboardRoutes.js` | Validation, parameterized SQL and CRUD responses |
| `server/src/app.js` | JSON middleware, CORS and mounting `/api/dashboard` |
| `client/src/dashboardApi.ts` | Central Axios base URL, endpoint paths, error extraction and request history |
| `client/src/StudentRecords.tsx` | Create, retrieve, edit, delete and fresh GET after writes |
| `client/src/Dashboardstudent.tsx` | Places StudentRecords in studentDashboard |

The pool has a maximum of 10 connections, a 5-second connection timeout, a 30-second idle timeout and a 10-second statement timeout. Single-statement routes call `pool.query`, which returns the acquired connection automatically. No route creates a pool per request. If a future operation uses multiple statements as a transaction, acquire one client and release it in a `finally` block.

## Demonstrate one record

1. Show the two SQL-inserted students and the keys using the commands above.
2. In Student records, choose New student and enter a fictional name, unique example.com email, major and year. Select Create student. Record the returned ID; do not assume the next number, since identity sequences can have gaps.
3. Expand Recent Axios requests to show POST 201 and GET 200. Query that ID directly in psql.
4. Reload the dashboard, enter the ID and select Retrieve record. This makes a new GET instead of relying on form state.
5. Change a name or year and select Save changes. Show PUT 200, the following GET 200, and a direct SQL query with the edited values and the same ID.
6. Select Delete student for that ID, then Retrieve record. Show DELETE 200 followed by GET 404 and the not-found message. Query the same ID in psql and show zero rows.

```sql
-- Replace 9 for your own future demonstration; 9 was the recorded demonstration.
SELECT s.*, m.name AS major_name
FROM student_dashboard.students s
JOIN student_dashboard.majors m ON m.id = s.major_id
WHERE s.id = 9;
SELECT COUNT(*) FROM student_dashboard.students WHERE id = 9;
```

The recorded sequence uses **student 9**, Rowan Harbor, changed to Rowan Harbor-Edited and enrollment year 2025, then deleted. See [evidence](EVIDENCE.md) and [endpoint inventory](ENDPOINTS.md). The original two manual samples remain.

## Verification

```powershell
npm run build --prefix client
npm run lint --prefix client
npm test --prefix server
npm run test:db --prefix server
```

The database check uses its own uniquely named fictional row and removes it afterwards. It verifies direct database persistence after create/update, fresh HTTP retrieval, duplicate email rejection, invalid major rejection, parent deletion restriction and absence after deletion. Do not use it as a substitute for the dashboard demonstration. `server/test/dashboard.test.js` checks invalid input, missing IDs, malformed JSON and a simulated unavailable connection returning 503.

This is a local learning app. It has no authentication or authorization, so deployment with real student data requires those controls, a restricted database role, HTTPS and suitable operational monitoring. CORS is a browser policy, not authorization. No real student data was added to these database tables.

## References

- [node-postgres pooling](https://node-postgres.com/features/pooling)
- [node-postgres parameterized queries](https://node-postgres.com/features/queries)
- [Express routing](https://expressjs.com/en/guide/routing/)
- [Axios API](https://axios.rest/pages/advanced/api-reference)
