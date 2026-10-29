# Student database API

Student Records, Student lookup, and Transcript all read the same PostgreSQL students in `student_dashboard.students`. Lookup and transcript requests query PostgreSQL; the old hard-coded directory and transcript fixture have been removed.

## Setup

Configure `server/.env` for your local PostgreSQL database as described in the [database walkthrough](database/README.md), then run from the repository root:

```sh
npm run db:setup --prefix server
npm run dev
```

For an existing student database, add just the transcript table and sample records:

```sh
npm run db:transcripts --prefix server
```

This executes `003_transcripts.sql` and `004_transcript_samples.sql` in one transaction. Each student without any transcript courses receives six fictional courses across two terms. Repeated runs preserve existing transcript records and fill only students who still have none. Students added later have no transcript until courses are inserted or this command is run again. Samples are marked in the database and labeled in the UI.

The frontend uses relative `/api` requests through Vite's local development proxy, including when Vite chooses another port. For a separately hosted API, set `VITE_API_BASE_URL` and the server's `CLIENT_ORIGIN` to the frontend origin. These classroom endpoints require PostgreSQL and do not fall back to sample files when the database is unavailable.

## Read endpoints

| GET path | Result |
| --- | --- |
| `/api/students` | All saved students, ordered by database ID |
| `/api/students?name=Avery%20Morgan` | Full-name matches from PostgreSQL |
| `/api/transcripts?name=Avery%20Morgan` | Transcript for a unique first-and-last-name match |
| `/api/transcripts/:studentID` | Transcript by actual database ID |
| `/api/transcripts?studentID=1` | Equivalent ID query; use an ID from the student list |
| `/api/status` | Database-backed directory status and student count |
| `/api/health` | PostgreSQL connectivity |

Name searches ignore capitalization and repeated whitespace. Duplicate full names produce a clear message instead of selecting a student arbitrarily. Transcript errors distinguish missing students (`404 STUDENT_NOT_FOUND`), students without courses (`404 TRANSCRIPT_NOT_FOUND`), duplicate names (`409 AMBIGUOUS_NAME`), invalid searches (`400 INVALID_INPUT`), and unavailable database/schema (`503 DATABASE_UNAVAILABLE`).

Directory responses contain `{ students: [...] }`, with `studentID` (a string containing the actual database ID), `firstName`, `lastName`, and `major`. Transcript responses retain student identity, institution, `semesters`, and cumulative `summary`. The legacy `isMockData` response field indicates that the saved courses include sample data; it does not indicate a fixture fallback. GPA is calculated from saved course credit hours and grades on the 4.0 scale, including plus/minus grades. F counts as attempted credit but earns no credit.

The Transcript card starts empty and searches by **Student First Last Name**. The **GPA Calculator** remains an independent equal-weight calculator for manually entered grades. Alerts and Upcoming Courses are removed from the student dashboard.

Students with saved transcript courses cannot be deleted through Student Records; the API returns `409 STUDENT_HAS_TRANSCRIPT` to preserve academic history. The [CRUD endpoint reference](database/README.md) covers all remaining Student Records operations.

## Verification

```sh
npm test --prefix server
npm run test:db --prefix server
npm run build --prefix client
npm run lint --prefix client
```

Both API test suites require local PostgreSQL and permission to create disposable test databases. They remove only their generated databases. Transcript checks cover database-backed name searches, extra students outside the old fixtures, current database edits, repeatable sample insertion, weighted GPA including F, duplicate names, missing transcripts, constraints, and database failure without fallback.

With Express and Vite running:

```sh
npm run test:dashboard --prefix server
```

The dashboard browser check searches each current database student through both modules, compares rendered transcript totals to the API, checks empty/unknown searches, and checks mobile layout. It expects transcript samples to have been seeded and defaults to `http://localhost:5173`; set `BROWSER_URL` if needed.

## Reusable dashboard components

The student dashboard imports and renders six independent React components from `client/src`:

| Component | Responsibility | Optional props |
| --- | --- | --- |
| `StudentRecords` | Retrieve, create, edit, and delete a student | `id`, `selection: { studentId, requestKey }`, `onChange` |
| `AllStudents` | Database student list, refresh, pagination, and collapse controls | `id`, `refreshKey`, `onSelect(studentId)` |
| `StudentLookup` | Database search by full name | `id` |
| `WeatherCard` | Weather request, loading/error state, and refresh | `id` |
| `GpaCalculator` | Letter-grade entry and equal-weight GPA calculation | `id` |
| `TranscriptCard` | Database transcript search and weighted GPA display | `id`, `apiBaseUrl` |

Each component works with a simple import and render, such as `<GpaCalculator />` or `<AllStudents />`, on another application page. All application styles live in `client/src/App.css`, imported once by `client/src/main.tsx`. Components use classes from that shared stylesheet; a different application reusing them should load it once at its entry point. Components containing forms should be placed alongside other forms rather than nested inside an HTML `<form>`.

All props are optional. Internal labels use React `useId()` so multiple instances do not create duplicate input/heading IDs. Supply distinct `id` props only when you need anchor links. The dashboard coordinates All Students and Student Records through props: `onSelect` requests a fresh record, and `onChange` increments the list's `refreshKey` after successful writes. The modules do not import each other or depend on the dashboard.

With Vite and Express running, `npm run test:components --prefix server` renders two instances of every component outside the dashboard to check unique labels and independent state. Weather uses a deterministic test response for this check.
