-- Lab 10 sample data. Every person here is fictional.
-- Run after schema.sql: psql -U postgres -d csc425_practice -f server/db/seed.sql
-- Running it again skips rows that already exist.

INSERT INTO student_dashboard.majors (code, name) VALUES
  ('CSC', 'Computer Science'),
  ('CIS', 'Information Systems'),
  ('BUS', 'Business Administration')
ON CONFLICT (code) DO NOTHING;

INSERT INTO student_dashboard.students (first_name, last_name, email, major_id, enrollment_year, is_active)
SELECT v.first_name, v.last_name, v.email, m.id, v.enrollment_year, v.is_active
FROM (VALUES
  ('Avery',  'Morgan',  'avery.morgan@example.test',  'CSC', 2025, true),
  ('Jordan', 'Bennett', 'jordan.bennett@example.test', 'CIS', 2024, true),
  ('Taylor', 'Reed',    'taylor.reed@example.test',    'BUS', 2023, false)
) AS v (first_name, last_name, email, major_code, enrollment_year, is_active)
JOIN student_dashboard.majors m ON m.code = v.major_code
ON CONFLICT (email) DO NOTHING;

-- Check that the data was saved:
SELECT s.id, s.first_name, s.last_name, s.email, m.name AS major, s.enrollment_year, s.is_active
FROM student_dashboard.students s
JOIN student_dashboard.majors m ON m.id = s.major_id
ORDER BY s.id;
