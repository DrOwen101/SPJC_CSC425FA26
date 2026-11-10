-- Manually authored, fictional data. example.test is reserved for examples.
-- Running this lesson's seed again preserves existing records with these keys.
INSERT INTO student_dashboard.majors (code, name) VALUES
  ('CSC', 'Computer Science'),
  ('CIS', 'Information Systems'),
  ('MAT', 'Mathematics')
ON CONFLICT (code) DO NOTHING;

INSERT INTO student_dashboard.students
  (student_number,first_name, last_name, email, major_id, admission_term_id, is_active)
VALUES
  ('S1001','Avery', 'Morgan', 'avery.morgan@example.test',
   (SELECT id FROM student_dashboard.majors WHERE code = 'CSC'), (SELECT id
     FROM student_dashboard.academic_terms
     WHERE code = 'FA2026'), true),
  ('S1002', 'Jordan', 'Bennett', 'jordan.bennett@example.test',
   (SELECT id FROM student_dashboard.majors WHERE code = 'CIS'), (SELECT id
     FROM student_dashboard.academic_terms
     WHERE code = 'FA2025'), true),
  ('S1003','Taylor', 'Reed', 'taylor.reed@example.test',
   (SELECT id FROM student_dashboard.majors WHERE code = 'MAT'), (SELECT id
     FROM student_dashboard.academic_terms
     WHERE code = 'FA2024'), false)
ON CONFLICT (email) DO NOTHING;

-- Run this SELECT directly in psql to prove the rows and relationships exist.
SELECT
  s.id,
  s.first_name,
  s.last_name,
  s.email,
  m.name AS major,
  s.admission_term_id,
  s.is_active
FROM student_dashboard.students AS s
JOIN student_dashboard.majors AS m
  ON m.id = s.major_id
ORDER BY s.id;