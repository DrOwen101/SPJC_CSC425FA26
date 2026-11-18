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

INSERT INTO teachingSchedule
    (teacher_id, course_code, day_of_week, start_time, end_time, room)
VALUES
    ('T001', 'CSC430', 'Monday',    '09:00', '10:15', 'CS201'),
    ('T001', 'CSC430', 'Wednesday', '09:00', '10:15', 'CS201'),
    ('T001', 'CSC430', 'Friday',    '09:00', '10:15', 'CS201'),
    ('T001', 'CSC425', 'Monday',    '11:00', '12:15', 'CS205'),
    ('T002', 'CSC233', 'Tuesday',   '13:00', '14:15', 'CS110'),
    ('T002', 'CSC233', 'Thursday',  '13:00', '14:15', 'CS110');
