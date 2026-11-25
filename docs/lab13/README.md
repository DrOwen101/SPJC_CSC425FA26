# Lab 13 Admin Dashboard

The Admin Dashboard uses the same React, Axios, Express, and PostgreSQL setup as the student and faculty labs. The rows and accounts are fictional classroom data.

| Item | Type and source |
| --- | --- |
| Create a class section | New. Course Management in the semester guide calls for creating sections. The form adds the course title, section ID, department, meeting times, room, and instructor. |
| Assign an instructor | New. Course Management also calls for assigning instructors. Changing an assignment updates which Faculty Dashboard owns the section. |
| Department section directory | Repurposed from the Faculty Dashboard teaching schedule. The same schedule table now shows multiple departments with instructor names and enrollment counts. The department filter is applied on the server. |
| Attendance concerns | Repurposed from the Faculty Dashboard attendance roster. The same student rows now show two or more absences over multiple meetings, including the latest date, for a department or all departments. |

## Run locally

Use the existing PostgreSQL settings in `server/.env`. On a fresh database, run the previous student database setup and `npm run setup:faculty --prefix server` first. Then run these commands from the project folder.

```powershell
npm run setup:admin --prefix server
Get-Content server/.env.lab13-admin
```

Start the API with `npm run dev --prefix server` and the client with `npm run dev --prefix client` in separate terminals. Open [Admin Dashboard](http://localhost:5173/#admin-dashboard), using the Vite port printed in the terminal, and sign in as `admin-demo` with the generated password. The password file is ignored by Git. Keep it out of screenshots.

## Quick demo

1. Create a Computing section with a fresh ID like `CSC130-01`, then find it under Department section directory.
2. Change the new section from Jamie Rivera to Casey Monroe. Check the new instructor in the directory and in Casey's faculty schedule. Use only the new section for this demo to preserve the Lab 12 examples.
3. Filter by Computing and Mathematics. The directory and attendance concerns should show different rows. The seeded Computing report includes Morgan Hayes with two absences.
4. Sign in to Admin as a student or faculty account. The admin tools are blocked. Express responds with `401` without a session and `403` with a valid student or faculty session.

The protected routes are under `/api/admin`. `GET /instructors` lists faculty choices. `GET /sections` and `GET /attendance-concerns` accept an optional `department` query. `POST /sections` creates a section and `PATCH /sections/:id/instructor` takes an instructor ID. The lab uses one administrator role. The department dropdown filters data for that role.
