-- Seed every currently saved student who has NO transcript courses.
-- Existing academic records are never changed or supplemented with sample rows.
INSERT INTO student_dashboard.transcript_courses
  (student_id, institution, term, term_start, course_code, course_title, credit_hours, grade, is_sample)
SELECT s.id, 'Sample College', sample.term, sample.term_start,
       sample.course_code, sample.course_title, sample.credit_hours, sample.grade, true
FROM student_dashboard.students s
CROSS JOIN (VALUES
  ('Fall 2025', DATE '2025-08-18', 'ENG101', 'College Writing', 3, 'A'),
  ('Fall 2025', DATE '2025-08-18', 'MAT115', 'College Algebra', 3, 'B+'),
  ('Fall 2025', DATE '2025-08-18', 'CSC101', 'Introduction to Computing', 4, 'A-'),
  ('Spring 2026', DATE '2026-01-12', 'COM101', 'Public Speaking', 3, 'B'),
  ('Spring 2026', DATE '2026-01-12', 'STA201', 'Introduction to Statistics', 3, 'A'),
  ('Spring 2026', DATE '2026-01-12', 'CSC201', 'Programming Fundamentals', 4, 'B+')
) AS sample(term, term_start, course_code, course_title, credit_hours, grade)
WHERE NOT EXISTS (
  SELECT 1 FROM student_dashboard.transcript_courses t WHERE t.student_id = s.id
)
ON CONFLICT (student_id, term_start, course_code) DO NOTHING;
