-- Manually authored, fictional data. example.test is reserved for examples.
-- Running this lesson's seed again preserves existing records with these keys.
INSERT INTO student_dashboard.majors (code, name) VALUES
  ('EES', 'Environmental Science'),
  ('CSS', 'Computer Science'),
  ('MAT', 'Mathematics')
ON CONFLICT (code) DO NOTHING;

INSERT INTO student_dashboard.students
  (first_name, last_name, email, major_id, enrollment_year, is_active)
VALUES
  ('Clifford', 'Howard', 'clifford.howard@example.test',
   (SELECT id FROM student_dashboard.majors WHERE code = 'EES'), 2026, true),
  ('Scooby', 'Doo', 'scooby.doo@example.test',
   (SELECT id FROM student_dashboard.majors WHERE code = 'CSS'), 2025, true),
  ('Johnny', 'Parlay', 'johnny.parlay@example.test',
   (SELECT id FROM student_dashboard.majors WHERE code = 'MAT'), 2024, false)
ON CONFLICT (email) DO NOTHING;

-- Run this SELECT directly in psql to prove the rows and relationships exist.
SELECT s.id, s.first_name, s.last_name, s.email, m.name AS major,
       s.enrollment_year, s.is_active
FROM student_dashboard.students s
JOIN student_dashboard.majors m ON m.id = s.major_id
ORDER BY s.id;