
-- CSC 425 Module 10
-- Fictional sample student data

-- Insert students
INSERT INTO students (student_id, first_name, last_name, email)
VALUES
    (1001, 'John', 'Smith', 'john.smith@example.com'),
    (1002, 'Emma', 'Davis', 'emma.davis@example.com')
ON CONFLICT (student_id) DO NOTHING;

-- Insert related enrollment records
INSERT INTO enrollments (student_id, course_code, grade)
SELECT student_id, course_code, grade
FROM (
    VALUES
        (1001, 'CSC425', 'A'),
        (1001, 'CSC455', 'A'),
        (1002, 'CSC425', 'A')
) AS sample(student_id, course_code, grade)
WHERE NOT EXISTS (
    SELECT 1
    FROM enrollments e
    WHERE e.student_id = sample.student_id
      AND e.course_code = sample.course_code
);

-- Verify inserted students
SELECT * FROM students ORDER BY student_id;

-- Verify student enrollments
SELECT * FROM enrollments ORDER BY student_id, course_code;
