-- Run after schema.sql in the studentdashboard database.
-- Safe to rerun for the sample records; does not erase other data.

INSERT INTO students (student_id, first_name, last_name, major)
VALUES
    ('1001', 'Avery', 'Morgan', 'Computer Science'),
    ('1002', 'Jordan', 'Bennett', 'Information Systems'),
    ('1003', 'Taylor', 'Reed', 'Business Administration'),
    ('1004', 'Cameron', 'Brooks', 'Mathematics'),
    ('1005', 'Riley', 'Parker', 'Computer Science')
ON CONFLICT (student_id) DO NOTHING;

INSERT INTO enrollments (student_id, course_code, semester, grade)
SELECT v.student_id, v.course_code, v.semester, v.grade
FROM (VALUES
    ('1001', 'CSC425', 'Fall 2026', 'A'),
    ('1001', 'CSC430', 'Fall 2026', 'B'),
    ('1002', 'CSC425', 'Fall 2026', 'A'),
    ('1003', 'BUS301', 'Fall 2026', 'B')
) AS v(student_id, course_code, semester, grade)
WHERE NOT EXISTS (
    SELECT 1 FROM enrollments e
    WHERE e.student_id = v.student_id
      AND e.course_code = v.course_code
      AND e.semester = v.semester
);
