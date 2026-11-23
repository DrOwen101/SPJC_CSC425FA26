INSERT INTO student_dashboard.assignments(section_id, title, instructions, due_at, max_points)
VALUES
    ((SELECT id FROM student_dashboard.course_sections WHERE course_code_snapshot = 'EGR 344' AND section_number = 'SEC01'),
        'Chapter 11 HW',
        'Complete questions 1-7 from the textbook',
        TIMESTAMPTZ '2026-11-24 23:59:00-05:00',
        100),
    ((SELECT id FROM student_dashboard.course_sections WHERE course_code_snapshot = 'EGR 344' AND section_number = 'SEC01'),
        'Chapter 9 HW',
        'Complete questions 1-3 from the textbook',
        TIMESTAMPTZ '2026-11-17 23:59:00-05:00',
        100),
    ((SELECT id FROM student_dashboard.course_sections WHERE course_code_snapshot = 'CSC425' AND section_number = 'SEC01'),
        'Faculty Dashboard',
        'Complete the faculty dashboard and the HAR assignment',
        TIMESTAMPTZ '2026-11-22 23:59:00-05:00',
        100),
    ((SELECT id FROM student_dashboard.course_sections WHERE course_code_snapshot = 'MAT308' AND section_number = 'SEC01'),
        'Chapter 7 HW',
        'Complete questions 1-5 from the textbook',
        TIMESTAMPTZ '2026-11-30 23:59:00-05:00',
        100)
;

