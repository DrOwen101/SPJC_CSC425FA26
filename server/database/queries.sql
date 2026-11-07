-- Retrive student info by joining enrollments, students, majors, and course tables together.
SELECT
    s.id AS student_id,
    s.first_name,
    s.last_name,
    m.name AS major,
    c.course_code,
    c.course_name,
    e.semester,
    e.grade
FROM student_dashboard.enrollments e
JOIN student_dashboard.students s
    ON e.student_id = s.id
JOIN student_dashboard.majors m
    ON s.major_id = m.id
JOIN student_dashboard.courses c
    ON e.course_id = c.id
ORDER BY s.id, e.semester;

-- Shows and UPDATE statement by changing Jordan's enrollment year.
-- This targets a specific student using WHERE, while the express backend
-- uses a reuseable UPDATE query to edit any student through the dashboard.
UPDATE student_dashboard.students
SET enrollment_year = 2026,
    updated_at = CURRENT_TIMESTAMP
WHERE email = 'jordan@example.test';

-- Verify that Jordan's enrollment year was updated successfully.
SELECT
    id,
    first_name,
    last_name,
    email,
    enrollment_year
FROM student_dashboard.students
WHERE email = 'jordan@example.test';

-- Demonstrate an INSERT statement by adding a temp student.
-- The student's major ID is retrieved from the majors table.
-- ON CONFLICT prevents inserting a duplicate email.
INSERT INTO student_dashboard.students
(first_name, last_name, email, major_id, enrollment_year)
VALUES (
    'Test',
    'Student',
    'test.student@example.test',
    (SELECT id FROM student_dashboard.majors WHERE code = 'CSC'),
    2026
)
ON CONFLICT (email) DO NOTHING;

-- Demonstrate a DELETE statement by removing the temp student.
-- This targets a specific record using WHERE, while the express backend
-- uses a resuable DELETE query to remove students through the dashboard.
DELETE FROM student_dashboard.students
WHERE email = 'test.student@example.test';

-- Verify that the temp student was deleted successfully.
SELECT *
FROM student_dashboard.students
WHERE email = 'test.student@example.test';

