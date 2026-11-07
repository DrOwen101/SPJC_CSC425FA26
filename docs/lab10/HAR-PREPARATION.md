# Lab 10 HAR preparation notes

Use these implementation facts to prepare your individual Human Advantage Review. They are study notes, not a claim of independent student work. Review the files, run your own demonstration and explain the decisions in your own words. The technical demonstration used ID 9; use the evidence index for exact references.

## 1 Understanding

Trace `StudentRecords.save` -> `dashboardApi.create` or `.update` -> Axios JSON request -> CORS and `express.json` in `app.js` -> the matching method/path in `dashboardRoutes.js` -> validation -> shared `pool.query` in `db.js` -> parameterized INSERT/UPDATE -> PostgreSQL constraints -> returned joined row -> JSON response. The frontend then calls `api.get(id)` and displays that separately retrieved record. A direct psql SELECT is independent evidence that the row is stored. React state is temporary and a successful HTTP response can come from the wrong API or mock code, so neither alone proves persistence.

## 2 Judgment

PostgreSQL was already working with `csc425_practice`. Majors and students have a many-to-one relationship; each student's `major_id` must reference a real major. Generated student ID is the identity used throughout the demonstration, while unique email prevents duplicates. GET reads, POST creates, PUT replaces all editable student values and DELETE removes one row. The pool reuses a bounded set of connections, avoiding a new connection for every request while allowing several concurrent queries. Its connection cap consumes server capacity and must be sized for the number of deployed backend instances. This project uses PostgreSQL, not SQLite.

## 3 Critical thinking

For a reported save missing from SQL, inspect the browser request URL/method, JSON body, response code and response ID. Check `VITE_API_BASE_URL`, the `/api/dashboard` prefix and `DB_NAME`, `DB_HOST` and user settings on the server without sharing secrets. Confirm `SELECT current_database()` and query `student_dashboard.students` using the returned ID. Review SQL parameters and check whether the response came from the mock `/api/students` path. A changed form or success message is weak evidence. Reloading and making a new GET, followed by a direct SELECT in the same database, is stronger. Also consider a deleted row, uncommitted transaction, stale server process or lookup against the wrong schema.

## 4 Professional responsibility

The database examples are fictional. Server validation checks types, bounds and required values; SQL placeholders separate data from SQL. PostgreSQL enforces the unique email and foreign key even for direct SQL. `.env` is ignored; `.env.example` has placeholders. Update uses `WHERE id = $7`; delete uses `WHERE id = $1`; both target a primary key and check whether a row existed. Invalid IDs receive 400, absent rows receive 404, and duplicate emails receive 409. No blank or arbitrary WHERE clause is constructed from user input. Authentication, authorization and a least-privilege database role are still future improvements; do not describe CORS as access control or claim the classroom app is production ready.

## 5 Defensibility and independent mastery

Explain the actual update of ID 9: `PUT /api/dashboard/students/9` with the full six-field JSON input changed lastName to Harbor-Edited and enrollmentYear to 2025. `validateStudent` returns values in the placeholder order. `WHERE id = $7` uses the path ID; the primary key limits the update to one row. `RETURNING *` supplies the saved row, and the JOIN adds the major name. `StudentRecords.save` then makes a GET for ID 9. The SQL evidence confirms the name/year and changed updated_at while created_at and ID stay fixed. The originally empty database was resolved by running the schema and manual SQL inserts. Only describe an additional problem as your own if you actually investigated it.

## 6 Future thinking

One useful next improvement is authentication plus student-level authorization. The current routes allow any caller who can reach the server to modify fictional records. Add server-verified sessions or tokens and check ownership/role before SQL. Verify authorized CRUD still works, unauthorized requests receive 401/403 and direct SQL shows no change after rejected writes. Use fictional users and avoid storing production student data during testing.

## Phase 3 Changed environment and failed writes

Already implemented: `dashboardApi.ts` centralizes `VITE_API_BASE_URL`, all CRUD paths, the timeout and error extraction. Change the public environment value and restart/rebuild Vite. Keep `/api/dashboard` matched with the Express mount. If the frontend origin also changes, update the allowed CORS origin in `app.js`; HTTPS hosting also needs an HTTPS API. These deployment changes were not performed in this local lab.

Trace a failed write using the Axios request history, request body, HTTP error and backend error code. The route awaits the database query before returning 201/200. Expected connection failures become 503, and the frontend catches rejected requests. No automatic write retry is implemented. A timeout or lost response can leave the write outcome uncertain, so retrieve the ID or check the unique email before retrying. If a write returns an ID but its follow-up GET fails, the UI retains that identity and reports the refresh failure.

The shared pg Pool already limits clients and connection wait time. `pool.query` handles acquire/release for these single statements. A future multi-query transaction would need `pool.connect`, BEGIN/COMMIT/ROLLBACK, and `client.release()` in `finally`. Do not silently swallow errors or return success before a query completes. An idempotency key could make retried creates safer; this is proposed and was not implemented.

Tests actually run: a real database create/retrieve/update/delete cycle with direct SQL checks; invalid inputs, malformed JSON and missing rows; API-level connection failure simulated with an injected database that throws ECONNREFUSED. Expected responses are 201/200 for successful writes, 503 for connection failure and 404 for a missing row. The browser demonstration also verified successful writes and the deleted record's 404.

Proposed additional browser test: run a separate test backend on another port with a deliberately unavailable database, point a test frontend at it, submit a unique fictional student, and require an error with no Saved message. Restore the connection and query that unique email directly to prove no row was written. The UI failure scenario with a stopped database was not executed. Keep the working database available; do not stop a shared service just to simulate failure.

## Disclosure and work to complete yourself

Identify Codex as assistance for implementation, documentation and tool-assisted checks, and identify the official documentation used. State what you personally reviewed, changed, tested or explained. Do not claim independent mastery until you can trace the code and reproduce the sequence without relying on a generated explanation. Finish all six individual answers and the transfer response in the supplied HAR form, export it as PDF, and submit it with the repository, branch, pushed hash and evidence.
