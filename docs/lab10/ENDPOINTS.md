# Student records endpoint inventory

Local API base URL: `http://localhost:3000`. All responses are JSON. The dashboard sends requests with Axios from `client/src/dashboardApi.ts`. All student data below belongs to PostgreSQL, while earlier `/api/students` and `/api/transcripts` paths belong to separate mock exercises.

| Method | Path | Purpose | Request | Expected success response |
| --- | --- | --- | --- | --- |
| GET | `/api/dashboard/majors` | List allowed parent records for the form | No body | 200 `{ "majors": [{ "id": 1, "code": "CS", "name": "Computer Science" }] }` |
| GET | `/api/dashboard/students` | Read students with joined major names | No body | 200 `{ "students": [Student, ...] }`; empty database returns `{ "students": [] }` |
| POST | `/api/dashboard/students` | Create one student | JSON StudentInput below | 201 `{ "student": Student }`; Location header `/api/dashboard/students/<new ID>` |
| GET | `/api/dashboard/students/:id` | Retrieve the same student by primary key | Positive integer path ID, no body | 200 `{ "student": Student }` |
| PUT | `/api/dashboard/students/:id` | Replace the editable values of one student | Positive integer path ID and full JSON StudentInput | 200 `{ "student": Student }`; same ID, new updatedAt |
| DELETE | `/api/dashboard/students/:id` | Delete exactly one student | Positive integer path ID, no body | 200 `{ "deletedId": 9 }` when deleting ID 9 |
| GET | `/api/health` | Check the backend database connection | No body | 200 `{ "status": "ok", "database": "connected", "timestamp": "..." }` |

## StudentInput

POST and PUT require `Content-Type: application/json` and all six fields. IDs and years are JSON numbers; active status is a JSON boolean. `majorId` must exist in the majors table. PUT does not create an absent student.

```json
{
  "firstName": "Rowan",
  "lastName": "Harbor",
  "email": "rowan.harbor.lab10@example.com",
  "majorId": 1,
  "enrollmentYear": 2026,
  "isActive": true
}
```

Names are trimmed, nonblank and at most 80 characters. Emails are trimmed, lowercase, formatted as an email and at most 254 characters. Enrollment year must be an integer between 1900 and 2100. Major ID and path ID must be integers from 1 to 2147483647. Email uniqueness and the foreign key are also enforced by PostgreSQL.

## Student response

The following illustrates the actual fields. The generated ID and timestamps depend on the database. The recorded demonstration received ID 9, which has since been deleted.

```json
{
  "student": {
    "id": 9,
    "firstName": "Rowan",
    "lastName": "Harbor",
    "email": "rowan.harbor.lab10@example.com",
    "majorId": 1,
    "majorName": "Computer Science",
    "enrollmentYear": 2026,
    "isActive": true,
    "createdAt": "2026-11-05T14:21:02.739Z",
    "updatedAt": "2026-11-05T14:21:02.739Z"
  }
}
```

For the update, send the full input with `lastName: "Harbor-Edited"` and `enrollmentYear: 2025` to `PUT /api/dashboard/students/9`. The returned student keeps ID 9. Both reads and writes join `majors` to include `majorName`.

## Errors

| Status | Error | When |
| --- | --- | --- |
| 400 | `INVALID_ID` | Malformed, zero, negative or out-of-range path ID |
| 400 | `INVALID_STUDENT` | Missing/invalid required values, nonexistent major or a database constraint violation |
| 400 | `INVALID_JSON` | Body is not valid JSON |
| 404 | `STUDENT_NOT_FOUND` | GET, PUT or DELETE targets an absent student |
| 409 | `DUPLICATE_EMAIL` | Another student already uses the normalized email |
| 413 | `BODY_TOO_LARGE` | Request exceeds the JSON middleware limit |
| 503 | `DATABASE_UNAVAILABLE` | Connection failure, acquisition timeout or database connection limit |
| 500 | `DATABASE_ERROR` | Other database failures; details stay out of the response |

Example after deleting ID 9:

```json
{
  "error": "STUDENT_NOT_FOUND",
  "message": "Student 9 was not found."
}
```

The UI displays the server message for failed requests, preserves the generated ID if a write succeeds but a follow-up retrieval fails, and does not automatically retry writes. A lost response can leave a write's outcome uncertain; retrieve by ID or list/search by the unique email before retrying. A UI label or a 201 response alone is supplemented by fresh GET and direct SQL evidence.
