INSERT INTO faculty_dashboard.sections (id, title, instructor_id, meeting_days, starts_at, ends_at, location)
SELECT v.id, v.title, a.id, v.days, v.starts_at::time, v.ends_at::time, v.location
FROM (VALUES
    ('CSC125-01', 'Introduction to Programming', 'faculty-demo', 'Mon / Wed', '09:00', '10:15', 'Technology 204'),
    ('CSC210-02', 'Web Application Development', 'faculty-demo', 'Tue / Thu', '13:30', '14:45', 'Technology 108'),
    ('MAT150-01', 'College Algebra', 'faculty-other', 'Mon / Wed', '10:30', '11:45', 'Science 102')
) AS v(id, title, username, days, starts_at, ends_at, location)
JOIN faculty_dashboard.accounts a ON a.username = v.username
ON CONFLICT (id) DO NOTHING;

INSERT INTO faculty_dashboard.students (id, full_name, major) VALUES
    (1201, 'Robin Ellis', 'Computer Science'),
    (1202, 'Morgan Hayes', 'Information Systems'),
    (1203, 'Jules Ortiz', 'Computer Science'),
    (1204, 'Parker Quinn', 'Mathematics')
ON CONFLICT (id) DO NOTHING;

INSERT INTO faculty_dashboard.enrollments (section_id, student_id) VALUES
    ('CSC125-01', 1201), ('CSC125-01', 1202), ('CSC125-01', 1203),
    ('CSC210-02', 1201), ('CSC210-02', 1203), ('MAT150-01', 1204)
ON CONFLICT DO NOTHING;

INSERT INTO faculty_dashboard.scores (section_id, student_id, item, earned, possible) VALUES
    ('CSC125-01', 1201, 'Lab 1', 19, 20), ('CSC125-01', 1201, 'Quiz 1', 24, 30),
    ('CSC125-01', 1202, 'Lab 1', 17, 20), ('CSC125-01', 1202, 'Quiz 1', 25, 30),
    ('CSC210-02', 1201, 'Lab 1', 48, 50), ('CSC210-02', 1203, 'Lab 1', 41, 50),
    ('MAT150-01', 1204, 'Quiz 1', 17, 20)
ON CONFLICT DO NOTHING;
