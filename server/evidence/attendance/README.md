# Attendance API evidence

- Repository: https://github.com/DrOwen101/SPJC_CSC425FA26
- Branch: [`jason-owen/attendance-api`](https://github.com/DrOwen101/SPJC_CSC425FA26/tree/jason-owen/attendance-api)
- Tested application commit: [`de588b36a099d92fd0c89a6b622ba3be6e455212`](https://github.com/DrOwen101/SPJC_CSC425FA26/commit/de588b36a099d92fd0c89a6b622ba3be6e455212)
- Captured October 20, 2026, using a fresh local Express process and Google Chrome.
- [Lab guide and design decisions](../../ATTENDANCE.md)
- [Full original response bodies and source-file hashes](responses.json)
- [HTML evidence report](index.html) — download and open locally to view as a page.

These screenshots format real browser fetch responses and show the exact URL, method, HTTP status, JSON content type, response body, branch, and tested source commit. They are explicitly labeled report views. The final evidence commit adds this folder without changing the tested server runtime. The latest pushed submission SHA is provided in the final submission message; verify it with `git ls-remote origin refs/heads/jason-owen/attendance-api`.

## Verification results

| Check | Result |
| --- | --- |
| `npm test --prefix server` | 9 tests passed; includes transcript regression tests |
| Browser evidence capture | 18 responses verified; 18 screenshots saved |
| Missing-record and rejected-write behavior | Attendance collection unchanged after requests |
| `npm run build` | Passed |
| `npm run lint` | No errors; one pre-existing unused-disable warning in `client/Module 5 BugHunt/script2.js` |
| `git diff --check` | Passed |

No deployed service, PostgreSQL attendance storage, or learner oral defense is claimed.

## Screenshots

| Screenshot | Request / result |
| --- | --- |
| [01 — Route discovery](01-routes.png) | `GET /` → 200, attendance route examples |
| [02 — API status](02-status.png) | `GET /api/status` → 200 |
| [03 — Attendance collection](03-all-attendance.png) | `GET /api/attendance` → 200, 12 records |
| [04 — Student 1001](04-student-1001.png) | 200, 66.67% |
| [05 — Student 1002](05-student-1002.png) | 200, 100% |
| [06 — Student 1003](06-student-1003.png) | 200, 66.67% |
| [07 — Student 1004](07-student-1004.png) | 200, 33.33% |
| [08 — Student 1005](08-student-1005.png) | 200, no records, percentage `null` |
| [09 — Present](09-present.png) | Dated record → 200, `present` |
| [10 — Late](10-late.png) | Dated record → 200, `late` |
| [11 — Absent](11-absent.png) | Dated record → 200, `absent` |
| [12 — Missing record / transfer case](12-missing-record.png) | Valid student and date → 404, `ATTENDANCE_NOT_FOUND` |
| [13 — Unknown student](13-unknown-student.png) | Valid ID `9999` → 404 |
| [14 — Invalid ID](14-invalid-id.png) | ID `abc` → 400 |
| [15 — Invalid date](15-invalid-date.png) | February 30 → 400 |
| [16 — Read-only API](16-read-only.png) | POST → 405 |
| [17 — No records for known student](17-no-records.png) | Student `1005`, dated record → 404 |
| [18 — Unknown route](18-unknown-route.png) | Extra path segment → 404 |
