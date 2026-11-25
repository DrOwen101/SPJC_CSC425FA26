BEGIN;

ALTER TABLE faculty_dashboard.accounts
  DROP CONSTRAINT IF EXISTS accounts_role_check;
ALTER TABLE faculty_dashboard.accounts
  ADD CONSTRAINT accounts_role_check CHECK (role IN ('student', 'faculty', 'admin'));

ALTER TABLE faculty_dashboard.sections
  ADD COLUMN IF NOT EXISTS department TEXT NOT NULL DEFAULT 'GEN'
  CHECK (department IN ('CSC', 'MAT', 'GEN'));

UPDATE faculty_dashboard.sections SET department = 'CSC'
WHERE department = 'GEN' AND id IN ('CSC125-01', 'CSC210-02');
UPDATE faculty_dashboard.sections SET department = 'MAT'
WHERE department = 'GEN' AND id = 'MAT150-01';

-- Fictional historical marks for the Admin report. Keep any marks already entered.
INSERT INTO faculty_dashboard.attendance (section_id, student_id, meeting_date, status)
SELECT e.section_id, e.student_id, d.meeting_date::date, 'absent'
FROM faculty_dashboard.enrollments e
CROSS JOIN (VALUES ('2026-11-09'), ('2026-11-11')) AS d(meeting_date)
WHERE (e.section_id, e.student_id) IN (('CSC125-01', 1202), ('MAT150-01', 1204))
ON CONFLICT DO NOTHING;

COMMIT;
