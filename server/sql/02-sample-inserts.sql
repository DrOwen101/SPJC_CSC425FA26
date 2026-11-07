-- Fictional examples entered with SQL, independently of the dashboard.
BEGIN;
INSERT INTO student_dashboard.majors (code, name) VALUES
    ('CS', 'Computer Science'),
    ('IS', 'Information Systems'),
    ('MATH', 'Mathematics')
ON CONFLICT (code) DO NOTHING;

INSERT INTO student_dashboard.students
    (first_name, last_name, email, major_id, enrollment_year, is_active)
VALUES
    ('Morgan', 'Vale', 'morgan.vale@example.com',
     (SELECT id FROM student_dashboard.majors WHERE code = 'CS'), 2026, TRUE),
    ('Casey', 'Finch', 'casey.finch@example.com',
     (SELECT id FROM student_dashboard.majors WHERE code = 'MATH'), 2025, TRUE)
ON CONFLICT (email) DO NOTHING;
COMMIT;

SELECT s.id, s.first_name, s.last_name, s.email, m.code AS major, s.enrollment_year
FROM student_dashboard.students s
JOIN student_dashboard.majors m ON m.id = s.major_id
ORDER BY s.id;
