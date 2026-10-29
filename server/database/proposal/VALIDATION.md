# Proposed schema validation

Date: October 27, 2026. PostgreSQL: 18.6. Scope: temporary database only.

Created the 18 main tables, then the 3 optional tables. Inserted fictional related examples into every table. The temporary database was removed in cleanup; no proposed tables or test rows were added to `csc425_practice`.

| # | Check | Expected result | Outcome |
| --- | --- | --- | --- |
| 1 | `Created 21 tables and inserted valid related examples into every table` | Success | Passed |
| 2 | `INSERT INTO student_dashboard.students(student_number,first_name,last_name,email) VALUES ('001001','Other','Person','other@example.test')` | 23505 | Passed |
| 3 | `UPDATE student_dashboard.students SET email='UPPER@EXAMPLE.TEST' WHERE id=1` | 23514 | Passed |
| 4 | `UPDATE student_dashboard.students SET first_name=NULL WHERE id=1` | 23502 | Passed |
| 5 | `DELETE FROM student_dashboard.majors WHERE id=1` | 23001 or 23503 | Passed |
| 6 | `UPDATE student_dashboard.course_sections SET capacity=0 WHERE id=1` | 23514 | Passed |
| 7 | `UPDATE student_dashboard.courses SET default_credit_hours=0 WHERE id=1` | 23514 | Passed |
| 8 | `INSERT INTO student_dashboard.enrollments(student_id,section_id,grading_scheme_id) VALUES(1,1,1)` | 23505 | Passed |
| 9 | `UPDATE student_dashboard.enrollments SET grading_scheme_id=2 WHERE id=1` | 23503 | Passed |
| 10 | `UPDATE student_dashboard.grade_codes SET grade_points=NULL WHERE code='A'` | 23514 | Passed |
| 11 | `UPDATE student_dashboard.enrollments SET status='completed' WHERE id=1` | 23514 | Passed |
| 12 | `UPDATE student_dashboard.enrollments SET final_grade_code='Z',grade_posted_by=1,grade_posted_at=clock_timestamp() WHERE id=1` | 23503 | Passed |
| 13 | `INSERT INTO student_dashboard.attendance_records(meeting_id,enrollment_id,section_id,status,recorded_by) VALUES(2,1,2,'present',1)` | 23503 | Passed |
| 14 | `INSERT INTO student_dashboard.submissions(assignment_id,enrollment_id,section_id) VALUES(2,1,2)` | 23503 | Passed |
| 15 | `UPDATE student_dashboard.submissions SET points_awarded=90 WHERE id=1` | 23514 | Passed |
| 16 | `UPDATE student_dashboard.submissions SET submission_text=NULL WHERE id=1` | 23514 | Passed |
| 17 | `UPDATE student_dashboard.notification_recipients SET read_at='2000-01-01T00:00:00Z'` | 23514 | Passed |
| 18 | `UPDATE student_dashboard.audit_events SET action='edit'` | 55000 | Passed |
| 19 | `DELETE FROM student_dashboard.audit_events` | 55000 | Passed |
| 20 | `TRUNCATE student_dashboard.audit_events` | 55000 | Passed |
| 21 | `INSERT INTO student_dashboard.course_materials(section_id,title,created_by) VALUES(1,'Missing URL',1)` | 23514 | Passed |
| 22 | `INSERT INTO student_dashboard.office_hours(faculty_id,starts_at,ends_at) VALUES(1,'2026-10-29T14:00:00Z','2026-10-29T15:00:00Z')` | 23514 | Passed |
| 23 | `UPDATE student_dashboard.appointments SET ends_at=starts_at WHERE id=1` | 23514 | Passed |
| 24 | `updated_at trigger overrides a manually supplied stale timestamp` | Success | Passed |

SQLSTATE meanings: `23505` uniqueness; `23514` CHECK constraint; `23502` required column; `23503` foreign key; `23001` restricted deletion; `55000` append-only audit trigger.

These checks validate the DDL and the listed constraints. They do not claim implementation of authentication, seat-allocation concurrency, academic policy, history freezing, or booking conflict detection.
