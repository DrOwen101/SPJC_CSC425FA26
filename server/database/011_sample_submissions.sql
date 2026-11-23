INSERT INTO student_dashboard.submissions
  (assignment_id, enrollment_id, section_id, submitted_at, submission_text, attachment_key)
SELECT
  a.id,
  e.id,
  a.section_id,
  TIMESTAMPTZ '2026-11-22 18:00:00-05:00',
  'My completed answers for questions 1 through 7.',
  NULL
FROM student_dashboard.assignments AS a
JOIN student_dashboard.enrollments AS e ON e.section_id = a.section_id
JOIN student_dashboard.students AS s ON s.id = e.student_id
WHERE a.title = 'Chapter 11 HW'
  AND a.section_id = (
    SELECT id
    FROM student_dashboard.course_sections
    WHERE course_code_snapshot = 'EGR 344'
      AND section_number = 'SEC01'
  )
  AND s.student_number = 'S1001'
ON CONFLICT (assignment_id, enrollment_id) DO NOTHING;