# PostgreSQL Student Transcript API

A read-only classroom API backed by PostgreSQL. The setup command creates the `students` and `transcripts` tables and loads five fictional sample students from `src/data/transcripts.json`.

## Run the server

Create a PostgreSQL database first, copy `.env.example` to `server/.env`, and set the database name, user, and password there. `PORT` overrides port 3000; `HOST` defaults to `0.0.0.0` so other devices can connect. The server also recognizes the older `server/src/.env` location, but `server/.env` is preferred.

From the repository root:

```bash
npm ci --prefix server
npm run db:setup --prefix server
npm start --prefix server
```

For automatic restarts while editing, use `npm run dev --prefix server`. The existing root `npm run dev` also starts this API alongside the frontend. Run only one server on the same port.

Check the API in a browser or terminal:

```bash
curl http://localhost:3000/api/status
curl http://localhost:3000/api/students
curl http://localhost:3000/api/transcripts/1001
```

`/api/status`, `/api/students`, `/api/transcripts`, and `/api/health` require PostgreSQL. Database errors return HTTP **503**. Password authentication failures are reported as PostgreSQL error `28P01`; check `DB_USER` and `DB_PASSWORD` without sharing the password.

## Endpoints to give students

Replace `BASE_URL` with your server address, such as `http://localhost:3000` when running on the same computer.

| Method | URL | Result |
| --- | --- | --- |
| GET | `BASE_URL/api/students` | `{ "students": [...] }` with available IDs, names, and majors |
| GET | `BASE_URL/api/transcripts/1001` | One complete student transcript |
| GET | `BASE_URL/api/transcripts?studentID=1001` | The same transcript using a query parameter |
| GET | `BASE_URL/api/status` | Database-backed API availability and student count |

| studentID | Fictional student | Major |
| --- | --- | --- |
| `1001` | Avery Morgan | Computer Science |
| `1002` | Jordan Bennett | Information Systems |
| `1003` | Taylor Reed | Business Administration |
| `1004` | Cameron Brooks | Mathematics |
| `1005` | Riley Parker | Computer Science |

IDs are strings containing exactly four digits. A missing or malformed ID returns HTTP **400**. An unknown four-digit ID, such as `9999`, returns HTTP **404**:

```json
{
  "error": "STUDENT_NOT_FOUND",
  "message": "No student was found with studentID 9999."
}
```

Requests are read-only and allow browser access from any origin. Use normal `fetch`; no credentials or `mode: 'no-cors'` are needed. The API provides no create, update, or delete operations.

## PostgreSQL data and sample records

`GET /api/students` reads the `students` table. It returns `{ "students": [...] }`, with each record containing a string `studentID`, `firstName`, `lastName`, and `major`.

`GET /api/transcripts/:studentID` joins the matching row in `students` to its row in `transcripts`. The semester course lists and summary totals are stored as PostgreSQL `jsonb`.

`npm run db:setup --prefix server` creates both tables and inserts only missing records from [`src/data/transcripts.json`](src/data/transcripts.json). Existing records are not overwritten. To change the database data, update it with SQL or edit the seed process deliberately; rerunning setup will not replace rows already present.

## Transcript data

The seed source in [`src/data/transcripts.json`](src/data/transcripts.json) contains five sample transcripts, each with:

- `studentID`, `firstName`, `lastName`, `major`, `institution`, and `isMockData`.
- `semesters`: two completed terms, each containing four courses, `creditsAttempted`, `creditsEarned`, and `gpa`.
- Each course contains `courseCode`, `courseTitle`, `creditHours`, and `grade`.
- `summary`: overall `creditsAttempted`, `creditsEarned`, and `cumulativeGPA`.

Grades were randomly selected once and saved. They are inserted into PostgreSQL by the setup command; changing the JSON does not overwrite already-seeded database rows. If grades or credits change, update the stored summaries and run the tests to verify them.

GPA uses A=4, B=3, C=2, D=1, F=0, weighted by credit hours and rounded to two decimal places. F grades count toward attempted credits and GPA but earn no credits. Cumulative GPA is calculated from all courses, not rounded semester averages. A frontend can use `.toFixed(2)` for display.

## Frontend request example

```javascript
const API_BASE_URL = 'http://localhost:3000'; // Replace with the instructor's address.

async function loadTranscript(studentID) {
  const response = await fetch(
    `${API_BASE_URL}/api/transcripts/${encodeURIComponent(studentID)}`
  );
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Unable to load transcript.');
  }

  return data;
}

// Call this from a form submit handler; use the result to render your own UI.
try {
  const transcript = await loadTranscript('1001');
  console.log(transcript.firstName, transcript.lastName);
  console.log(transcript.semesters);
  console.log(transcript.summary.cumulativeGPA.toFixed(2));
} catch (error) {
  console.error(error); // Show a friendly message in your frontend.
}
```

Suggested practice: build a student ID form, a loading indicator, an error message, a table for each semester, and a cumulative GPA/credits summary. Use `/api/students` if you want a dropdown of available students.

## Included React example

The Lab 7 Student Dashboard imports and renders `<StudentLookup />` in [`Dashboardstudent.tsx`](../client/src/Dashboardstudent.tsx). [`StudentLookup.tsx`](../client/src/StudentLookup.tsx) owns the form, state, API request, and result rendering. It requests `/api/students` only after a full-name search and displays one matching student's ID, first name, last name, and major. Blank, missing, ambiguous, and failed searches display messages instead of records. [`studentLookupApi.ts`](../client/src/studentLookupApi.ts) supplies response types, validation, and name normalization; `StudentLookup.css` supplies the lookup styles.

The dashboard also renders the Lab 6 [`TranscriptCard.tsx`](../client/src/TranscriptCard.tsx) for student ID searches and full transcripts. It operates independently of the Lab 7 name lookup:

```tsx
import TranscriptCard from './TranscriptCard'

// Use inside a component's JSX:
<TranscriptCard id="transcript" />
```

It loads student `1001` initially. Enter another ID and select **Load transcript** to request a different record. The example uses Axios with `async`/`await`, checks HTTP errors and JSON fields, and cancels requests on navigation or after a 15-second timeout.

Run `npm run dev` from the repository root to start both applications. Open the frontend's Student tab. By default, the card calls port `3000` on the same hostname and protocol as the frontend. To connect to another API host, pass its base URL (without `/api`):

```tsx
<TranscriptCard apiBaseUrl="https://your-api.example.com" />
```

Alternatively, set `VITE_API_BASE_URL=https://your-api.example.com` in `client/.env.local` and restart Vite (or rebuild for production). The value is a public server address, not a secret. For an HTTPS frontend, use an HTTPS API. The optional `id` prop supports page anchors when mounting this standalone example.

## Let classmates connect

**Same classroom network:** keep this server running and share `http://YOUR_COMPUTER_LAN_IP:3000/api/transcripts/1001`. Replace the placeholder with your computer's actual network address. On their computers, `localhost` means their own computer. Allow incoming connections to port 3000 if your firewall prompts. Campus Wi-Fi must permit connections between devices; being on the same Wi-Fi alone does not guarantee access.

**Public internet:** deploy PostgreSQL and the server, configure the database environment variables, and run `npm run db:setup` once against the database. Configure the host's health check to `/api/health`. The server accepts the host's `PORT` environment variable. Share the host's HTTPS address followed by `/api/transcripts/1001`. An HTTPS frontend should use an HTTPS API address. Never include database credentials in frontend code or commit them.

Running locally does not create a public internet URL. Verify the chosen address from a student's device before distributing it to the class.

## Verify

```bash
npm test --prefix server
```

Tests make real HTTP requests on a temporary local port and cover all five sample transcripts, GPA and credit totals, both lookup forms, invalid/unknown IDs, cross-origin requests, and database-backed status using a query stub.
