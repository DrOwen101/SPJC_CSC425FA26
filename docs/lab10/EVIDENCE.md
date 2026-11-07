# Recorded CRUD evidence

Database: PostgreSQL `csc425_practice`; schema: `student_dashboard`; driver: `pg`.
Branch: `Isaac-Pohl/lab10-crud`. Obtain the final pushed hash with `git rev-parse HEAD`; the accompanying submission PDF records that hash. All application and SQL steps below track **student ID 9**.

| Step | Evidence file | Observation |
| --- | --- | --- |
| Schema | `evidence/00-schema-keys-and-constraints.txt` | Actual psql table descriptions show both PKs, FK, index, types and checks |
| Manual inserts | `evidence/01-schema-and-manual-inserts.txt` | psql ran schema/INSERT files; JOIN returns Morgan Vale (1) and Casey Finch (2) before application entry |
| Create and fresh GET | `evidence/02-created-and-retrieved.jpg` | Dashboard says saved and retrieved ID 9; values are Rowan Harbor, CS, year 2026 |
| Direct persistence | `evidence/03-database-after-create.txt` | Direct SELECT in csc425_practice finds ID 9 with the created values |
| Reload and retrieve | `evidence/04-retrieved-after-reload.jpg` | A page reload discards frontend state; the dashboard retrieves ID 9 again |
| Edit and retrieve | `evidence/05-updated-and-retrieved.jpg` and `05b-updated-retrieval-request.jpg` | Same ID 9, last name Harbor-Edited and year 2025; fresh GET 200 displays stored edits |
| Direct updated row | `evidence/06-database-after-update.txt` | SELECT finds the edited values under ID 9 |
| Delete | `evidence/07-deleted-in-dashboard.jpg` | Dashboard confirms deletion of ID 9 |
| App absence | `evidence/08-not-found-after-delete.jpg` and `08b-delete-and-404-requests.jpg` | GET for ID 9 returns 404; request list also shows DELETE 200 |
| Direct absence | `evidence/09-database-after-delete.txt` | ID 9 returns zero rows and COUNT is 0; manual examples 1 and 2 remain |

## Observed Axios request sequence

The following requests were read directly from the dashboard request history during the browser demonstration. The initial viewport screenshot shows the saved record; the text below preserves the observed request entries that were below that viewport. Timestamps are UTC.

```text
2026-11-05T14:21:02.800Z POST /api/dashboard/students   201
2026-11-05T14:21:02.837Z GET /api/dashboard/students/9  200
2026-11-05T14:22:28.468Z GET /api/dashboard/students/9  200  (after reload)
2026-11-05T14:22:54.053Z PUT /api/dashboard/students/9  200
2026-11-05T14:22:54.075Z GET /api/dashboard/students/9  200
2026-11-07T16:20:54.279Z GET /api/dashboard/students/9  200  (after restart)
2026-11-07T16:21:13.590Z DELETE /api/dashboard/students/9 200
2026-11-07T16:21:20.506Z GET /api/dashboard/students/9  404
```

The demonstration began November 5 and resumed November 7 after the local app restarted. The same PostgreSQL row survived that interruption. SQL output uses local Central time (-06:00); frontend timestamps use UTC. The time zones describe the same instants.

## Assistance disclosure and individual explanation

Codex assisted with schema design, implementation, setup, documentation, terminal checks and browser verification. These evidence files record tool-assisted results. They do not claim that the student independently wrote or verified the work. Use [HAR preparation notes](HAR-PREPARATION.md) to understand the implementation, then answer the handout's individual questions in your own words and describe the work you actually performed independently.

## Local browser port verification

The backend was updated to permit the explicit local dashboard origins on ports 5173 and 5174 (localhost or 127.0.0.1). This fixes database requests being blocked by browser CORS checks when Vite chooses 5174. Other origins remain outside the allowlist.

On November 7 the browser at http://localhost:5174/#student-records loaded all three majors and saved students Morgan Vale, Casey Finch and the user's manually inserted Samira Lane (ID 10). GET /api/dashboard/majors and GET /api/dashboard/students returned 200 at approximately 17:18:07 UTC. See evidence/10-local-port5174.jpg. This screenshot verifies the local connection fix, separately from the original ID 9 CRUD demonstration.

server/test/dashboardCors.test.js checks reads and preflight for POST, PUT and DELETE on both supported ports and verifies that unrelated origins do not receive CORS access. No records were created, edited or deleted while checking this connection fix.
