# Mock Student Transcript API

A read-only classroom API with **five fictional students**. Students build their own frontend to request a transcript by `studentID` and display it. No database, API key, login, or additional packages are required for these endpoints.

## Run the server

From the repository root:

```bash
npm ci --prefix server
npm start --prefix server
```

For automatic restarts while editing, use `npm run dev --prefix server`. The existing root `npm run dev` also starts this API alongside the frontend. Run only one server on the same port.

The default address is `http://localhost:3000`. `PORT` overrides port 3000; `HOST` defaults to `0.0.0.0` so other devices can connect. A `.env` file is optional for the transcript API. If needed, copy `.env.example` to `.env` inside `server` and run the npm scripts above.

Check the API in a browser or terminal:

```bash
curl http://localhost:3000/api/status
curl http://localhost:3000/api/students
curl http://localhost:3000/api/transcripts/1001
```

`/api/status` checks the mock API without PostgreSQL. The existing `/api/health` still checks PostgreSQL and can return 503 when that database is unavailable; this does not prevent transcript requests.

## Endpoints to give students

Replace `BASE_URL` with your server address, such as `http://localhost:3000` when running on the same computer.

| Method | URL | Result |
| --- | --- | --- |
| GET | `BASE_URL/api/students` | `{ "students": [...] }` with available IDs, names, and majors |
| GET | `BASE_URL/api/transcripts/1001` | One complete student transcript |
| GET | `BASE_URL/api/transcripts?studentID=1001` | The same transcript using a query parameter |
| GET | `BASE_URL/api/status` | API availability and student count |

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
  "message": "No mock student was found with studentID 9999."
}
```

Requests are public and allow browser access from any origin. Use normal `fetch`; no credentials or `mode: 'no-cors'` are needed. The API provides no create, update, or delete operations.

## Transcript data

The editable JSON object is in [`src/data/transcripts.json`](src/data/transcripts.json). Its `students` array contains exactly five transcripts, each with:

- `studentID`, `firstName`, `lastName`, `major`, `institution`, and `isMockData`.
- `semesters`: two completed terms, each containing four courses, `creditsAttempted`, `creditsEarned`, and `gpa`.
- Each course contains `courseCode`, `courseTitle`, `creditHours`, and `grade`.
- `summary`: overall `creditsAttempted`, `creditsEarned`, and `cumulativeGPA`.

Grades were randomly selected once and saved, so repeated requests and server restarts return the same data. Restart the server after editing the JSON (or use the development watcher). If grades or credits change, update the stored summaries and run the tests to verify them.

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

The Student Dashboard now uses [`TranscriptCard.tsx`](../client/src/TranscriptCard.tsx), which owns its API request, state, and CSS, like `WeatherCard`:

```tsx
import TranscriptCard from './TranscriptCard'

// Use inside a component's JSX:
<TranscriptCard />
```

It loads student `1001` initially. Enter another ID and select **Load transcript** to request a different record. The example uses `fetch` with `async`/`await`, checks HTTP errors and JSON fields, and cancels requests on navigation or after a 15-second timeout.

Run `npm run dev` from the repository root to start both applications. Open the frontend's Student tab. By default, the card calls port `3000` on the same hostname and protocol as the frontend. To connect to another API host, pass its base URL (without `/api`):

```tsx
<TranscriptCard apiBaseUrl="https://your-api.example.com" />
```

Alternatively, set `VITE_API_BASE_URL=https://your-api.example.com` in `client/.env.local` and restart Vite (or rebuild for production). The value is a public server address, not a secret. For an HTTPS frontend, use an HTTPS API. The optional `id` prop supports page anchors; the dashboard uses `<TranscriptCard id="transcript" />`.

## Let classmates connect

**Same classroom network:** keep this server running and share `http://YOUR_COMPUTER_LAN_IP:3000/api/transcripts/1001`. Replace the placeholder with your computer's actual network address. On their computers, `localhost` means their own computer. Allow incoming connections to port 3000 if your firewall prompts. Campus Wi-Fi must permit connections between devices; being on the same Wi-Fi alone does not guarantee access.

**Public internet:** run the `server` folder on a Node.js host with install command `npm ci --omit=dev` and start command `npm start`. Configure the host's health check to `/api/status`. The server accepts the host's `PORT` environment variable. Share the host's HTTPS address followed by `/api/transcripts/1001`. An HTTPS frontend should use an HTTPS API address. No PostgreSQL service or database credentials are required for this exercise.

Running locally does not create a public internet URL. Verify the chosen address from a student's device before distributing it to the class.

## Verify

```bash
npm test --prefix server
```

Tests make real HTTP requests on a temporary local port and cover all five transcripts, GPA and credit totals, both lookup forms, invalid/unknown IDs, cross-origin requests, and database-independent status.
