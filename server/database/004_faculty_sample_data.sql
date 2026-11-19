INSERT INTO student_dashboard.faculty (first_name, last_name, email, password_hash) VALUES
  ('Milly',  'Watkins', 'milly.watkins@example.test', crypt('teach-demo-1', gen_salt('bf'))),
  ('Soma', 'Heckford',  'soma.heckford@example.test', crypt('teach-demo-2', gen_salt('bf')))
ON CONFLICT (email) DO NOTHING;

INSERT INTO student_dashboard.courses (code, title, credit_hours) VALUES
  ('BUS101', 'Introduction to Business', 3),
  ('MGT210', 'Principles of Management', 3),
  ('TOU150', 'Introduction to Tourism', 3)
ON CONFLICT (code) DO NOTHING;

INSERT INTO student_dashboard.course_sections (course_id, term, section_number, faculty_id)
SELECT c.id, 'Fall 2026', '01', f.id
FROM (VALUES ('BUS101', 'milly.watkins@example.test'),
             ('MGT210', 'milly.watkins@example.test'),
             ('TOU150', 'soma.heckford@example.test')) AS v(course_code, faculty_email)
JOIN student_dashboard.courses c ON c.code = v.course_code
JOIN student_dashboard.faculty f ON f.email = v.faculty_email
ON CONFLICT (course_id, term, section_number) DO NOTHING;

INSERT INTO student_dashboard.enrollments (section_id, student_id)
SELECT cs.id, s.id
FROM student_dashboard.course_sections cs
JOIN student_dashboard.courses c ON c.id = cs.course_id
CROSS JOIN student_dashboard.students s
WHERE c.code IN ('BUS101', 'TOU150')
ON CONFLICT (section_id, student_id) DO NOTHING;

INSERT INTO student_dashboard.enrollments (section_id, student_id)
SELECT cs.id, s.id
FROM student_dashboard.course_sections cs
JOIN student_dashboard.courses c ON c.id = cs.course_id
CROSS JOIN (SELECT id FROM student_dashboard.students ORDER BY id LIMIT 2) s
WHERE c.code = 'MGT210'
ON CONFLICT (section_id, student_id) DO NOTHING;

INSERT INTO student_dashboard.attendance_records (enrollment_id, class_date, status, recorded_by)
SELECT e.id, dates.d::date, 'absent', cs.faculty_id
FROM student_dashboard.enrollments e
JOIN student_dashboard.course_sections cs ON cs.id = e.section_id
JOIN student_dashboard.courses c ON c.id = cs.course_id
CROSS JOIN (VALUES ('2026-10-05'), ('2026-10-12'), ('2026-10-19')) AS dates(d)
WHERE c.code = 'BUS101' AND e.student_id = (SELECT min(id) FROM student_dashboard.students)
ON CONFLICT (enrollment_id, class_date) DO NOTHING;

SELECT cs.id AS section_id, c.code, cs.term, f.email AS instructor,
       (SELECT count(*) FROM student_dashboard.enrollments e WHERE e.section_id = cs.id) AS enrolled
FROM student_dashboard.course_sections cs
JOIN student_dashboard.courses c ON c.id = cs.course_id
JOIN student_dashboard.faculty f ON f.id = cs.faculty_id
ORDER BY cs.id;