# Completed Mac lab — Jason Owen

Instructor reference example, October 20, 2026.

- Branch: `JasonOwen_DemoModule9`.
- Starting point: clean `main` commit `099570b`, verified against `origin/main`.
- Guide: [Mac PDF](guides/PostgreSQL_Express_Lab_Mac.pdf) in the guides folder, with the revised installation-location instructions.
- Database: `student_lookup`, login `postgres`, host `localhost`, port `5432`.
- Initial GET result: Avery Morgan (1), Jordan Bennett (2), Taylor Reed (3).
- POST result: **201 Created**, `Student added.`, Morgan Ellis, student ID **4**.
- Screenshot: [lookup-jason-owen.png](lookup-jason-owen.png).

## Request and response

Student Lookup submits a GET request to `/api/students`. Express routes it from `server/src/app.js` to the GET handler in `studentServer.js`. That handler calls `getStudents()` in `studentDb.js`, which waits for PostgreSQL to return rows. The handler sends `{ students: [...] }` as JSON. The existing React component finds the full-name match and displays the record.

For POST, `express.json()` makes the submitted JSON available in `req.body`. The POST handler checks the three fields and calls `addStudent()`. Its parameterized INSERT stores the supplied values, PostgreSQL generates the ID, and `RETURNING` provides the saved row. Express sends that row with HTTP 201. `await` waits for the query; `res.json()` sends the JSON response to the client.

## Installation and preservation

The revised guide found the existing PostgreSQL 18.6 tools in the personal Applications folder. No move to the shared Applications folder was required. The earlier `csc425fa26` cluster, connection settings, and startup configuration were preserved under `server/local-postgres/backups/before-mac-pdf-20261020T153651Z` before initializing the new lab cluster. The new password is stored only in the private `.env` file.

## Checks performed

The database connection reported connected. The seed script ran once and returned IDs 1–3. The PDF's POST example ran once and returned ID 4. Browser searches displayed Avery's ID 1 and Morgan's ID 4. The API/frontend and PostgreSQL were stopped and restarted using the guide's commands; Morgan's record was checked again afterward. The React client build passed.

The original mock-data test suite expects five students with IDs 1001–1005 and wildcard CORS for the directory. Those assumptions no longer describe this lab's database endpoint; the file was left unchanged to keep the implementation aligned with the PDF. The live checks above are the completion evidence for this example.

## Submission reference

Branch: https://github.com/DrOwen101/SPJC_CSC425FA26/tree/JasonOwen_DemoModule9

The screenshot and these notes are prepared for the instructor's demonstration. No course-system assignment submission was made.
