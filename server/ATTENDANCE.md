# Attendance API lab

Repository: https://github.com/DrOwen101/SPJC_CSC425FA26

Branch: [`jason-owen/attendance-api`](https://github.com/DrOwen101/SPJC_CSC425FA26/tree/jason-owen/attendance-api)

This implementation extends the existing Express application with read-only attendance APIs. It uses fictional records for one CSC 425 section and the five students already returned by `/api/students`. No database or additional Node packages are needed. The route contract below was selected because the supplied assignment did not specify exact route names.

## Run and verify

From the repository root:

```bash
npm ci --prefix server
npm start --prefix server
```

The default base URL is `http://localhost:3000`. If that port is in use, run `PORT=3001 npm start --prefix server` and use port 3001 in your requests.

In another terminal:

```bash
curl -i http://localhost:3000/
curl -i http://localhost:3000/api/attendance
curl -i http://localhost:3000/api/attendance/1001
curl -i http://localhost:3000/api/attendance/1001/2026-10-12
curl -i http://localhost:3000/api/attendance/1001/2026-10-19
npm test --prefix server
```

## Phase 1 — Artifact evidence

| Method | Route | Response |
| --- | --- | --- |
| GET | `/` | 200; application name and route examples |
| GET | `/api/status` | 200; existing mock API availability |
| GET | `/api/attendance` | 200; all 12 attendance records |
| GET | `/api/attendance/:studentID` | 200; student identity, records, and summary |
| GET | `/api/attendance/:studentID/:date` | 200; one recorded attendance status |

Student IDs contain exactly four digits. Dates must be real calendar dates in `YYYY-MM-DD` format. The API uses path parameters; query filtering is not part of this contract. All attendance responses use JSON. The public fictional-data routes support cross-origin GET, HEAD, and OPTIONS requests.

| Request | Expected status | Meaning |
| --- | --- | --- |
| `GET /api/attendance/1001` | 200 | Three records; one present, one late, one absent; 66.67% |
| `GET /api/attendance/1002` | 200 | Three present; 100% |
| `GET /api/attendance/1003` | 200 | One present, one late, one absent; 66.67% |
| `GET /api/attendance/1004` | 200 | One late, two absent; 33.33% |
| `GET /api/attendance/1005` | 200 | Known student, empty collection, percentage `null` |
| `GET /api/attendance/1001/2026-10-12` | 200 | Recorded `present` |
| `GET /api/attendance/1001/2026-10-14` | 200 | Recorded `late` |
| `GET /api/attendance/1001/2026-10-16` | 200 | Recorded `absent` |
| `GET /api/attendance/1001/2026-10-19` | 404 | `ATTENDANCE_NOT_FOUND` |
| `GET /api/attendance/9999` | 404 | `STUDENT_NOT_FOUND` |
| `GET /api/attendance/abc` | 400 | `INVALID_STUDENT_ID` |
| `GET /api/attendance/1001/2026-02-30` | 400 | `INVALID_DATE` |
| `POST /api/attendance/1001/2026-10-12` | 405 | `METHOD_NOT_ALLOWED`; no write occurs |
| `GET /api/attendance/1005/2026-10-12` | 404 | Known student, missing individual record |
| `GET /api/attendance/1001/2026-10-12/extra` | 404 | `ROUTE_NOT_FOUND` |

Attendance percentage is `(present + late) / total recorded sessions × 100`, rounded to two decimal places. Late counts as attended for this exercise. Unrecorded dates are excluded. This is not a claim about an institution's attendance policy.

### Evidence files and version traceability

The [evidence folder](evidence/attendance/) contains:

- `index.html`: readable report of actual browser HTTP requests and responses.
- `responses.json`: full request URLs, methods, status codes, headers, original response bodies, branch, tested source commit, capture time, and SHA-256 hashes of every tracked server runtime file.
- Eighteen PNG screenshots: route discovery, API status, collection response, all five student summaries, each attendance status, and each documented error case.

The screenshots are Chromium captures of a report formatting actual browser fetch responses. They are labeled as evidence views, not application UI or browser developer tools. They use a fresh local server on a temporary port, so they do not depend on a server already running on port 3000. Localhost URLs in the captures are not deployed public endpoints.

The source commit recorded in the evidence identifies the tested application. A following commit adds only evidence and documentation. The latest pushed submission commit therefore includes the tested source and its evidence without changing the application. A commit cannot contain its own full SHA in a tracked file; obtain the final SHA from GitHub or the commands below and use that full value in the submission.

```bash
git branch --show-current
git rev-parse HEAD
git ls-remote origin refs/heads/jason-owen/attendance-api
git status --short
```

The local and remote full SHAs must match and the working tree must be clean. Compare the tested source commit in `responses.json` with the latest pushed SHA:

```bash
git diff TESTED_SOURCE_SHA LATEST_PUSHED_SHA -- server/src server/package.json server/package-lock.json
```

Replace both placeholders with the actual SHAs. No output means the API code, fixtures, and dependency files are identical. The final submission message supplies the verified full pushed SHA and a direct commit link.

### Reproduce the screenshots

Commit runtime changes first. With Python 3.9+, Google Chrome, and Node.js installed:

```bash
python3 -m venv /tmp/attendance-evidence-env
/tmp/attendance-evidence-env/bin/pip install playwright==1.60.0
/tmp/attendance-evidence-env/bin/python server/scripts/capture_attendance.py --output /tmp/attendance-recheck
```

The script starts and stops its own Express process, sends real browser requests, asserts the documented status codes and selected response values, verifies that rejected requests did not change data, and saves fresh screenshots. It makes no Git changes and performs no push.

## Phase 2 — Decision evidence

These notes explain the supplied implementation. They are AI-assisted technical documentation, not evidence of a learner's independent judgment or an oral defense.

| Decision | Reason and consequence |
| --- | --- |
| Collection, student, and dated-record routes | Each URL identifies a resource and can be requested independently. |
| Input validation before lookup | A malformed ID or impossible date is a 400; a well-formed request for missing data is a 404. |
| Empty student collection is 200 | The student exists and the collection was retrieved successfully, even when it has no entries. |
| Missing dated record is 404 | No record exists to return. Returning `absent` would invent a fact about the student. |
| Missing percentage is `null` | No recorded sessions cannot establish either 0% or 100% attendance. |
| Static fictional data | Results are reproducible without credentials; this implementation does not save attendance or query PostgreSQL. |
| Read-only methods | POST, PUT, PATCH, and DELETE return 405, with an `Allow` header, rather than pretending to save changes. |

The learner should independently explain the route-to-fixture flow, justify the status codes, evaluate the late-arrival rule, identify what would change for multiple courses, and confirm which tests and screenshots they personally reviewed. Real student data would require authorization controls; this public mock API is not designed for it.

## Phase 3 — Transfer evidence

The transfer case is implemented and tested:

```http
GET /api/attendance/1001/2026-10-19
```

```json
{
  "error": "ATTENDANCE_NOT_FOUND",
  "message": "No attendance record was found for studentID 1001 on 2026-10-19.",
  "studentID": "1001",
  "date": "2026-10-19"
}
```

The response is HTTP **404**, with JSON content type. The date is valid and student `1001` exists. The missing-record branch in [`src/attendance.js`](src/attendance.js) returns the error without inserting or changing a record. [`test/attendance.test.js`](test/attendance.test.js) confirms this and separately verifies that a recorded absence returns 200. Screenshot `12-missing-record.png` captures the transfer response.

For an individual review, predict another valid missing date, request it, and explain why the response differs from a malformed date and from a recorded absence. Explain how a consuming UI should display “No attendance record” without labeling the student absent. The code and evidence support this demonstration; the learner still provides the explanation and live defense.
