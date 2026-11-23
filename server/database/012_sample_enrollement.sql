INSERT INTO student_dashboard.enrollments(student_id, section_id, grading_scheme_id, status)
VALUES
    ((SELECT id FROM student_dashboard.students WHERE student_number = 'S1001'),
    (SELECT id FROM student_dashboard.course_sections WHERE course_code_snapshot = 'EGR 344'),
    (SELECT id FROM student_dashboard.grading_schemes WHERE code = 'G001'),
    'enrolled'),
    ((SELECT id FROM student_dashboard.students WHERE student_number = 'S1001'),
    (SELECT id FROM student_dashboard.course_sections WHERE course_code_snapshot = 'CSC425'),
    (SELECT id FROM student_dashboard.grading_schemes WHERE code = 'G001'),
    'enrolled'),
    ((SELECT id FROM student_dashboard.students WHERE student_number = 'S1002'),
    (SELECT id FROM student_dashboard.course_sections WHERE course_code_snapshot = 'EGR 344'),
    (SELECT id FROM student_dashboard.grading_schemes WHERE code = 'G001'),
    'enrolled');

