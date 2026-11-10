# Express API endpoint inventory

- Base URL: `http://localhost:3000`


| Method | Path | Purpose | Request | Expected response |
| --- | --- | --- | --- | --- |
| GET | `/` | Describe the API and list endpoint paths. | No body. | HTTP 200 JSON with the service message and endpoint paths. |
| GET | `/api/status` | Check the database-backed student API and count students. | No body. | HTTP 200 `{ "status": "ok", "service": "PostgreSQL student API", "studentCount": 5 }`. |
| GET | `/api/health` | Check PostgreSQL connectivity. | No body. | HTTP 200 `{ "status": "ok", "database": "connected", "timestamp": "..." }`; HTTP 503 when unavailable. |
| GET | `/api/students` | Return the student directory. | No body. | HTTP 200 `{ "students": [{ "studentID": "1001", "firstName": "Avery", "lastName": "Morgan", "major": "Computer Science" }] }`. |
| GET | `/api/transcripts/:studentID` | Read a student's transcript. | Four-digit student ID in the path, such as `/api/transcripts/1001`. | HTTP 200 student identity, semester/course/grade data, credits, and calculated GPA summary. |
| GET | `/api/transcripts?studentID=1001` | Read the same transcript using a query parameter. | Four-digit `studentID` query parameter. | Same response shape as the path-based transcript route. |

Transcript requests with malformed or missing IDs return HTTP 400 `INVALID_STUDENT_ID`, an unknown ID returns HTTP 404 `STUDENT_NOT_FOUND`.

## Attendance

| CRUD  | Method | Path | Purpose | Expected request | Expected response |
| --- | --- | --- | --- | --- | --- |
| Create | POST | `/api/attendance` | Create an attendance entry when that student/date is new. | JSON `{ "studentID": "1001", "date": "2026-11-09", "status": "present" }`; status is `present`, `absent`, or `late`. | HTTP 200 `{ "id": 6, "studentID": "1001", "student": "Avery Morgan", "date": "2026-11-09", "status": "present" }`. |
| Read list | GET | `/api/attendance` | List attendance entries with student names. | No body. | HTTP 200 JSON array of `{ "id", "student", "date", "status" }` records. |
| Read one | GET | `/api/attendance/:id` | Retrieve an attendance record by its unique ID. | Positive integer ID in the path, such as `/api/attendance/6`. | HTTP 200 `{ "student": "Avery Morgan", "date": "2026-11-09", "status": "present" }`. |
| Update | POST | `/api/attendance` | Update the status of an existing attendance record for the submitted student/date. | Same JSON payload as create, with the new status. | HTTP 200 record with the original `id` and updated status. |
| Delete | DELETE | `/api/attendance/:id` | Delete the record identified by its primary key. | Positive integer ID in the path; no body. | HTTP 200 `{ "id": 6, "studentID": "1001", "student": "Avery Morgan", "date": "2026-11-09", "status": "present", "deleted": true }`. |

Malformed payloads/IDs return HTTP 400. A student ID that does not exist returns HTTP 404 `STUDENT_NOT_FOUND`. A read or delete for an unknown attendance ID returns HTTP 404 `ATTENDANCE_NOT_FOUND`.
