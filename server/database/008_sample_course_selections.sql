INSERT INTO student_dashboard.course_sections(
    course_id,
    term_id,
    section_number,
    instructor_id,
    grading_scheme_id,
    course_code_snapshot,
    title_snapshot,
    credit_hours,
    capacity,
    delivery_mode
)
VALUES
    (
        (SELECT id FROM student_dashboard.courses WHERE course_code = 'EGR344'),
        (SELECT id FROM student_dashboard.academic_terms WHERE code = 'FA2026'),
        'SEC01',
        (SELECT id FROM student_dashboard.faculty WHERE employee_number = 'E1002'),
        (SELECT id FROM student_dashboard.grading_schemes WHERE code = 'G001'),
        'EGR 344',
        'Fluid Mechanics',
        3,
        35,
        'in_person'
    ),
    (
        (SELECT id FROM student_dashboard.courses WHERE course_code = 'CSC425'),
        (SELECT id FROM student_dashboard.academic_terms WHERE code = 'FA2026'),
        'SEC01',
        (SELECT id FROM student_dashboard.faculty WHERE employee_number = 'E1001'),
        (SELECT id FROM student_dashboard.grading_schemes WHERE code = 'G001'),
        'CSC425',
        'Web Application and Services Development',
        3,
        30,
        'in_person'
    ),
    (
        (SELECT id FROM student_dashboard.courses WHERE course_code = 'MAT308'),
        (SELECT id FROM student_dashboard.academic_terms WHERE code = 'FA2026'),
        'SEC01',
        (SELECT id FROM student_dashboard.faculty WHERE employee_number = 'E1003'),
        (SELECT id FROM student_dashboard.grading_schemes WHERE code = 'G001'),
        'MAT308',
        'Calculus and Analytical Geometry II',
        5,
        20,
        'in_person'
    );
  