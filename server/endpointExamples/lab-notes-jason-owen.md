# PostgreSQL + Express Lab — Completed Instructor Example

**Name:** Jason Owen  
**Date:** October 20, 2026  
**Branch:** `jason-owen/postgresql-lab`

This is an instructor worked example prepared with AI assistance. The commands,
database queries, Node interactive request, and browser checks described below
were actually performed. Students should record and explain their own results.

## Environment and observed results

| Item | Observed value |
| --- | --- |
| Operating system | macOS 26.6.2, Apple Silicon |
| PostgreSQL | 18.6, installed through Postgres.app |
| Node.js / npm | v22.23.2 / 10.9.8 |
| Database | `csc425fa26` |
| Login used by Express | `csc425_student` |
| Table | `endpoint_examples.students` |
| Database / Express ports | 5432 / 3001 |
| GET before POST | HTTP 200; 5 records |
| POST | HTTP 201; Casey Diaz created with ID `1007` |
| GET after POST | HTTP 200; 6 records |
| GET after stopping and restarting Express | HTTP 200; the same 6 records |

## Step 1 — Update main and create a personal branch

Started with a clean working tree and ran:

```bash
git status
git switch main
git pull --ff-only origin main
git switch -c jason-owen/postgresql-lab
```

The pull reported that main was already up to date. The published main branch
did not contain the PDF's required demo files or the npm demo script. I restored
the previously prepared demo and copied the supplied Desktop PDF into this
branch. These prerequisites are included in the pull request so students can
receive them after the instructor merges it.

## Steps 2–3 — Confirm PostgreSQL and configure the course login

PostgreSQL was already installed and accepting local connections on port 5432.
Following the PDF's existing-installation check, I inspected and reused it.
This Mac uses Postgres.app's PostgreSQL binaries with a user login service;
I did not initialize a second server in the graphical application.

Created the lab login in psql:

```sql
CREATE ROLE csc425_student LOGIN;
```

Set its password using the interactive command:

```text
\password csc425_student
```

The database `csc425fa26` already existed and belonged to `csc425_demo`. I
inspected it as the PDF directs for an existing database. I preserved that
database, its owner, and its records, then granted `csc425_student` the access
needed for this lab. This was an existing-database run, not a fresh installation.

For a fresh student environment, the PDF's creation command is:

```sql
CREATE DATABASE csc425fa26 OWNER csc425_student;
```

That creation command was **not rerun** against this existing database.

Connected with the PDF's command:

```text
\connect csc425fa26 csc425_student localhost 5432
```

The connection check returned:

```text
 current_database |  current_user
------------------+----------------
 csc425fa26       | csc425_student
```

## Step 4 — Run setup and inspect the sample records

Ran `setup.sql` in psql as `csc425_student`. The script preserved the existing
five fictional seed records. Verified them with:

```sql
SELECT student_id, first_name, last_name, major
FROM endpoint_examples.students
ORDER BY student_id;
```

Before the POST, the result contained Avery Morgan, Jordan Bennett, Taylor Reed,
Cameron Brooks, and Riley Parker: **5 rows**.

## Step 5 — Configure the private connection settings

Updated the existing `server/.env` to use:

```dotenv
DB_HOST=localhost
DB_PORT=5432
DB_NAME=csc425fa26
DB_USER=csc425_student
```

The password is intentionally omitted from this example. It exists only in the
private local configuration. The previous instructor connection settings were
preserved in an ignored private backup.

```bash
git check-ignore server/.env
```

Returned:

```text
server/.env
```

Neither the configuration file nor its private backup is included in Git.

## Step 6 — Install dependencies and start Express

Ran the exact commands from the lab:

```bash
npm ci --prefix server
npm run demo --prefix server
```

Observed:

```text
PostgreSQL connected. Student example: http://localhost:3001/api/students
```

The dependency installation succeeded. npm also reported six advisories in the
existing dependency lockfile: one moderate, four high, and one critical.
Dependency versions were not changed as part of reproducing this lab.

## Step 7 — Verify GET in a browser

Opened `http://localhost:3001/api/students` in an isolated Chrome browser.
The response was **HTTP 200** with **5 students**, and Avery Morgan appeared
in the displayed JSON.

The first record was:

```json
{
  "studentID": "1001",
  "firstName": "Avery",
  "lastName": "Morgan",
  "major": "Computer Science"
}
```

## Step 8 — Send POST from the Node interactive prompt

Started `node` in a second terminal and ran:

```javascript
const response = await fetch('http://localhost:3001/api/students', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    firstName: 'Casey',
    lastName: 'Diaz',
    major: 'Computer Science'
  })
})

console.log(response.status)
console.log(await response.json())
```

The actual status was **201**, and the response contained:

```json
{
  "message": "Student created.",
  "student": {
    "studentID": "1007",
    "firstName": "Casey",
    "lastName": "Diaz",
    "major": "Computer Science"
  }
}
```

Sent the POST once, exited with `.exit`, and checked the browser again.
GET returned **6 students**, including Casey.

The ID is `1007` because an earlier verification used the preceding sequence
value. PostgreSQL-generated IDs need not be consecutive; a fresh setup may
assign Casey `1006`. The important result is the saved row and assigned ID.

## Step 9 — Verify persistence after restarting Express

Stopped Express with **Ctrl+C** and ran:

```bash
npm run demo --prefix server
```

Opened the endpoint again in Chrome. GET returned HTTP 200 and the same six
records as before the restart. A direct psql query using `csc425_student`
confirmed the final database contents:

| student_id | first_name | last_name | major |
| --- | --- | --- | --- |
| 1001 | Avery | Morgan | Computer Science |
| 1002 | Jordan | Bennett | Information Systems |
| 1003 | Taylor | Reed | Business Administration |
| 1004 | Cameron | Brooks | Mathematics |
| 1005 | Riley | Parker | Computer Science |
| 1007 | Casey | Diaz | Computer Science |

Casey's record remains in the local database for the classroom demonstration.

## Explanation answers

### 1. What is the difference between PostgreSQL and Express?

PostgreSQL is the database system. It stores student records and executes SQL.
Express handles HTTP requests in the Node application. A route asks PostgreSQL
for data and decides what HTTP response to send to the client.

### 2. What does `pool.query(...)` do?

It runs a SQL statement using a connection managed by the PostgreSQL connection
pool. It returns a promise for the query result. In the GET route, the result's
`rows` property contains the student records. In the POST route, the values
array supplies data for `$1`, `$2`, and `$3`, separately from the SQL text.

### 3. Why does the route use `await`?

The database operation takes time. `await` pauses that async route handler
until its query finishes, so it can use the returned records. Other requests
can still be processed while the handler waits.

### 4. How does a database record become a JSON response?

The browser requests `/api/students`. Express selects its GET handler, which
queries PostgreSQL. The `pg` driver exposes returned rows as JavaScript
objects. `res.json({ students: result.rows })` serializes those objects as JSON
and sends the HTTP response back to the browser.

For POST, `express.json()` first parses the incoming JSON into `req.body`.
The handler checks the fields and inserts a row. `RETURNING` supplies the saved
record, and `res.status(201).json(...)` sends it back with a Created status.

### 5. Why does switching Git branches leave database records unchanged?

Git tracks repository files. PostgreSQL stores its records in a separate data
directory managed by the database server. Switching branches changes tracked
files, not database rows. A setup script can be tracked in Git, but its effects
on a running database are separate from the script itself.

## Additional verification

- Existing server tests: **4 passed, 0 failed**.
- Demo JavaScript syntax check: passed.
- Git whitespace check: passed.
- Browser evidence was collected locally in isolated Chrome.
- No deployed or remote database behavior is claimed.

## Step 10 — Submission

This file is the completed lab-notes artifact. The lab branch and pull request
will contain the guide, runnable demo, and this instructor example. Publication
details are recorded here after the push and pull request are confirmed.
