# Student records verification — October 27, 2026

Verified locally in `csc425_practice` using PostgreSQL 18.6, Express on port 3000, Vite on port 5173, and Chrome. These are local results; no deployment or remote CI run is claimed.

## Requested work and evidence

| Requirement | Result |
| --- | --- |
| Related tables, keys, types, constraints | Created `student_dashboard.majors` and `student_dashboard.students`, with integer identity primary keys, required foreign key, uniqueness, not-null/check constraints, and an index on the foreign key. |
| 1. Manual fictional inserts and direct query | Executed the explicit INSERT SQL file through psql. The join SELECT returned Avery Morgan / Computer Science, Jordan Bennett / Information Systems, and Taylor Reed / Mathematics. |
| 2. Express database connection | Shared `pg.Pool` in `server/src/db.js`, using the configured local database. |
| 3. CRUD endpoints | POST, list GET, single-record GET, PUT, and DELETE under `/api/dashboard/students`; GET `/api/dashboard/majors` provides the relation options. |
| 4. Dashboard Axios connection | `Dashboardstudent` renders `StudentRecords`; `studentRecordsApi.ts` makes all requests with Axios through the Vite proxy. |
| 5. Create through dashboard | Chrome filled the form and submitted **Create student**. Final verification run created student **#5**, Casey Rivera. POST returned **201**. |
| 6. Direct database verification | An independent PostgreSQL query returned ID 5, first name Casey, last name Rivera, and the unique fictional test email. |
| 7. Retrieve/display the same record | Reloaded the page, entered ID 5, and used **Retrieve by ID**. GET returned **200** and the saved values appeared. |
| 8. Edit through dashboard | Changed the last name to Rivera-Santos, major to Information Systems, year to 2025, and active status to false. **Save changes** returned **200**. |
| 9. Verify edited values in both places | Queried PostgreSQL directly, reloaded the browser, and retrieved ID 5 again. All four edited fields matched in the database and form. |
| 10. Delete through dashboard | First tested **Cancel delete**, confirming the database row remained. Then used **Confirm delete**; DELETE returned **204**. |
| 11. Verify absence | Direct SQL returned **0 rows**. GET ID 5 returned **404** with “Student not found.” The selected details cleared, and refreshed/reloaded lists excluded the record. |
| 12. Endpoint documentation | [Setup and endpoint reference](README.md#5-endpoint-reference) documents each method, path, purpose, request, success response, and relevant error status. |

The browser test uses a unique `casey.crud.TIMESTAMP@example.test` email and cleans up only its own record. The three manually inserted sample students remain. An earlier successful run used ID 4; the final saved evidence uses ID 5. Generated IDs can have gaps.

## Checks performed

- Existing transcript/lookup HTTP tests: **4 passed**.
- Real PostgreSQL/API integration tests in a disposable database: **4 passed**. These include CRUD persistence, duplicate emails, invalid/missing fields, malformed/oversized JSON, missing records, foreign keys, and direct database constraints.
- Chrome dashboard CRUD with direct SQL checks: **passed**.
- Mobile viewport at 390px: **no page overflow**. The wide table scrolls within its own labeled region so text stays readable.
- Uncaught browser JavaScript errors during the CRUD test: **0**.
- Client TypeScript/production build: **passed**.
- Client lint: **0 errors**, with one pre-existing unused ESLint-disable warning in `client/Module 5 BugHunt/script2.js`.
- `git diff --check`: **passed**.

## Saved evidence

- [Machine-readable request and database evidence](verification/browser-verification.json)
- [Desktop screenshot after retrieving the edited record](verification/student-records-desktop.png)
- [Mobile screenshot after retrieving the edited record](verification/student-records-mobile.png)

Screenshots show the record before its verified deletion. Rerunning the browser test with `CRUD_EVIDENCE_DIR` replaces those evidence files with the new run's ID and email.

## Existing dependency findings

Installing the browser-test dependency reported four audit findings in existing server dependencies: `body-parser` (high), `brace-expansion` (high), `proxy-addr` (critical), and `qs` (moderate). Their affected versions were already in the original server lockfile. No finding was reported against the added Playwright packages. Dependency remediation was not included in this CRUD change.

Changes are local on `codex/student-records-crud`. Existing root `package.json` and `package-lock.json` edits were preserved. No commit, push, or deployment was performed.
