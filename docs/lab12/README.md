# Lab 12 Faculty Dashboard

The Faculty Dashboard uses React, Axios, Express and the same PostgreSQL pool as Lab 10. Its fictional accounts, sections, students and scores are in the separate `faculty_dashboard` schema.

| Item | Type and source | What to demonstrate |
| --- | --- | --- |
| Record attendance | New. Semester Project Guide attendance tracking and backlog stories 2034–2035. | Pick a section and date, mark a student, save and load that date again. Show that PostgreSQL kept the status. |
| Teaching schedule | New. The original Faculty Dashboard placeholder and instructor assignments in backlog story 2025. | Sign in as Jamie Rivera and show the two assigned sections with meeting times, locations and enrollment counts. Casey Monroe has a different schedule. |
| Find a student on your rosters | Repurposed from the Student Dashboard's `StudentLookup` module. | Search for Robin or 1201 and show both of Robin's assigned sections. The adapted module shares the search form and name normalization, searches in PostgreSQL across the instructor's rosters, and accepts partial names and IDs. |
| Section grade summary | Repurposed from the Student Dashboard's `TranscriptCard` module. Also fits backlog story 2043. | Switch between sections and compare current grades. The adapted module shares the accessible record table, but shows each enrolled student’s current weighted points instead of one student's semester transcript. |

## Start locally

1. From the repository root, install dependencies if needed using `npm ci --prefix client` and `npm ci --prefix server`.
2. Start your PostgreSQL service and keep the same private `server/.env` connection settings used for [Lab 10](../lab10/README.md). A new checkout needs the Lab 10 schema and seed data too if you want to demo the Student Dashboard's PostgreSQL features.
3. Run `npm run setup:faculty --prefix server`. This creates the faculty schema, sample sections, rosters and scores. Repeat runs preserve saved attendance and reuse the generated local credentials.
4. Use two terminals. Run `npm run dev --prefix server` in one and `npm run dev --prefix client` in the other.
5. Open [Faculty Dashboard](http://localhost:5173/#faculty-dashboard). Use the current Vite port if it differs. Read the generated passwords locally with `Get-Content server/.env.lab12-accounts`. The three usernames are `faculty-demo` (Jamie Rivera), `faculty-other` (Casey Monroe), and `student-demo` (Robin Ellis). The credentials file is ignored by Git. Keep its contents out of screenshots and commits.

## Sign-in and data access

Express verifies a salted scrypt password hash, creates a random four-hour server session, and requires a valid bearer token on data routes. The browser keeps the token in memory, so refreshing the page requires signing in again. Students see the access restriction, and Express independently returns HTTP 403 if a student token is used to call a faculty route. A request without a valid session gets 401. Section queries match the requested section against the signed-in faculty ID, and an unassigned section returns 404. The attendance write checks the entire batch against the selected roster before upserting anything. The role and instructor ID come from the server session.

The demo sessions live in one server process. This setup uses local fictional data and is meant to be run on your computer.

| Method and path under `/api/faculty` | Request | Successful response |
| --- | --- | --- |
| POST `/session` | JSON with `username` and `password` | 200 with token and basic user info |
| DELETE `/session` | Bearer token | 204, token revoked |
| GET `/sections` | Faculty token | 200 with assigned sections and enrollment counts |
| GET `/students?q=Robin` | Faculty token and name or student ID | 200 with matching students and authorized section IDs |
| GET `/sections/:id/grades` | Faculty token and section ID | 200 with current grades, including null percentages for ungraded students |
| GET `/sections/:id/attendance?date=2026-11-19` | Faculty token, section ID and ISO meeting date | 200 with enrolled students and saved statuses |
| PUT `/sections/:id/attendance` | Faculty token and JSON like `{"date":"2026-11-19","entries":[{"studentId":1201,"status":"present"}]}` | 200 with date and number of saved rows |

## Evidence and regression checks

- Take a screenshot of the teaching schedule, then search for `1201` to show Robin Ellis and both sections.
- Open the grade summary for `CSC125-01`. Robin's 43 out of 50 points display as 86.0%. Jules Ortiz has no graded work for this section.
- For attendance, choose a meeting date and mark student 1201. Save, switch dates and go back, or reload and sign in again. The recorded status should load from the database. Use the same date in SQL.

```sql
SELECT section_id, student_id, meeting_date, status
FROM faculty_dashboard.attendance
WHERE section_id = 'CSC125-01' AND student_id = 1201
ORDER BY meeting_date DESC;
```

- Sign out and sign in as `student-demo` to capture the blocked view. Run the automated verification to show 403 from the backend, 404 for a section owned by another instructor, and persistence confirmed directly in PostgreSQL.
- Open Student Dashboard. Verify student-records and majors load, search for Avery Morgan, and load transcript 1001. The shared lookup form and transcript table should behave as before.

```powershell
npm run build --prefix client
npm run lint --prefix client
npm test --prefix server
npm run test:db --prefix server
npm run test:faculty --prefix server
```

The faculty integration check starts its own local API port. It inserts and updates two attendance marks on an unused test date, checks the stored rows with SQL, and removes those two test rows afterward.
