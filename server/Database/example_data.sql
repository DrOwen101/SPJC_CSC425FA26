INSERT INTO student_records.majors (code, name) VALUES
('CS', 'Computer Science'),
('EE', 'Electrical Engineering'),
('ME', 'Mechanical Engineering'),
('BIO', 'Biology'),
('CHEM', 'Chemistry'),
('PHYS', 'Physics'),
('MATH', 'Mathematics'),
('ECON', 'Economics'),
('PSY', 'Psychology'),
('HIST', 'History')
on CONFLICT (code) DO NOTHING;

INSERT INTO student_records.students (first_name, last_name, email, major_id, enrollment_year, is_active) VALUES
('Joe', 'Schmoe', 'jscmoe@spjc.edu', (SELECT id FROM student_records.majors WHERE code = 'CS'), 2022, TRUE),
('Jane', 'Doe', 'jdoe@spjc.edu', (SELECT id FROM student_records.majors WHERE code = 'EE'), 2022, TRUE)
ON CONFLICT (email) DO NOTHING;

