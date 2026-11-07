-- Insert sample majors into the database, avoiding duplicates based on major code.
INSERT INTO student_dashboard.majors (code, name)
VALUES
    ('CSC', 'Computer Science'),
    ('CIS', 'Information Systems'),
    ('MAT', 'Mathematics'),
    ('ENG', 'English'),
    ('HIS', 'History'),
    ('BIO', 'Biology'),
    ('CHE', 'Chemistry'),
    ('PHY', 'Physics'),
    ('PSY', 'Psychology'),
    ('SOC', 'Sociology')
ON CONFLICT (code) DO NOTHING;

-- Insert fictional students and assign each one a major using its code.
INSERT INTO student_dashboard.students
(first_name, last_name, email, major_id, enrollment_year)
VALUES
    (
        'Avery',
        'Morgan',
        'avery@example.test',
        (SELECT id FROM student_dashboard.majors WHERE code = 'CSC'),
        2024
    ),
    (
        'Jordan',
        'Bennett',
        'jordan@example.test',
        (SELECT id FROM student_dashboard.majors WHERE code = 'CIS'),
        2025
    ),
    (
        'Justice',
        'Noback',
        'jnoback1@example.test',
        (SELECT id FROM student_dashboard.majors WHERE code = 'MAT'),
        2026
    ),
    (
        'Taylor',
        'Reed',
        'taylor@example.test',
        (SELECT id FROM student_dashboard.majors WHERE code = 'ENG'),
        2027
    ),
    (
        'Sheldon',
        'Cooper',
        'sheldon@example.test',
        (SELECT id FROM student_dashboard.majors WHERE code = 'PHY'),
        2028
    ),
    (
        'Peter',
        'Parker',
        'spiderman@example.test',
        (SELECT id FROM student_dashboard.majors WHERE code = 'BIO'),
        2029
    ),
    (
        'Bruce',
        'Banner',
        'hulk@example.test',
        (SELECT id FROM student_dashboard.majors WHERE code = 'CHE'),
        2030
    )
ON CONFLICT (email) DO NOTHING;

-- Insert sample courses with their course codes, names, and credit hours.
INSERT INTO student_dashboard.courses
(course_code, course_name, credit_hours)
VALUES
    ('CSC101', 'Introduction to Computer Science', 3),
    ('CSC233', 'Computer Programming II', 3),
    ('CIS307', 'Information Systems Management', 3),
    ('MAT145', 'College Algebra', 3),
    ('MAT250', 'Calculus I', 4),
    ('ENG105', 'Critical Reading and Writing', 3),
    ('HIS201', 'World History', 3),
    ('BIO101', 'Introduction to Biology', 4),
    ('CHE105', 'General Chemistry', 4),
    ('PHY130', 'General Physics', 4),
    ('PSY180', 'General Psychology', 3),
    ('SOC133', 'Introduction to Sociology', 3)
ON CONFLICT (course_code) DO NOTHING;

-- Insert sample enrollments by matching students and courses.
-- Include semesters and grades, while preventing duplicate enrollments.
INSERT INTO student_dashboard.enrollments
(student_id, course_id, semester, grade)
SELECT s.id, c.id, data.semester, data.grade
FROM (
    VALUES
        ('avery@example.test', 'CSC101', 'Fall 2026', 'A'),
        ('avery@example.test', 'CSC233', 'Spring 2027', NULL),
        ('jordan@example.test', 'CIS307', 'Fall 2026', 'B'),
        ('jordan@example.test', 'MAT145', 'Fall 2026', 'A'),
        ('jnoback1@example.test', 'MAT145', 'Fall 2026', 'A'),
        ('jnoback1@example.test', 'MAT250', 'Spring 2027', NULL),
        ('taylor@example.test', 'ENG105', 'Fall 2027', NULL),
        ('sheldon@example.test', 'PHY130', 'Fall 2028', NULL),
        ('spiderman@example.test', 'BIO101', 'Fall 2029', NULL),
        ('hulk@example.test', 'CHE105', 'Fall 2030', NULL)
) AS data(email, course_code, semester, grade)
JOIN student_dashboard.students s
    ON s.email = data.email
JOIN student_dashboard.courses c
    ON c.course_code = data.course_code
ON CONFLICT (student_id, course_id, semester) DO NOTHING;
