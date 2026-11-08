CREATE SCHEMA IF NOT EXISTS lab10;

CREATE TABLE lab10.students (
  student_id VARCHAR(4) PRIMARY KEY,
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  major VARCHAR(100) NOT NULL,
  CHECK (student_id ~ '^[0-9]{4}$')
);

CREATE TABLE lab10.attendance (
  id SERIAL PRIMARY KEY,
  student_id VARCHAR(4) NOT NULL,
  attendance_date DATE NOT NULL,
  status VARCHAR(10) NOT NULL,
  FOREIGN KEY (student_id)
    REFERENCES lab10.students(student_id)
    ON DELETE RESTRICT,
  CHECK (status IN ('present', 'absent', 'late')),
  UNIQUE (student_id, attendance_date)
);

-- Manually insert fictional student data.
INSERT INTO lab10.students
  (student_id, first_name, last_name, major)
VALUES
  ('1001', 'Avery', 'Morgan', 'Computer Science'),
  ('1002', 'Jordan', 'Bennett', 'Information Systems'),
  ('1003', 'Taylor', 'Reed', 'Business Administration');

INSERT INTO lab10.attendance
  (student_id, attendance_date, status)
VALUES
  ('1001', '2026-10-20', 'present'),
  ('1002', '2026-10-20', 'absent'),
  ('1003', '2026-10-20', 'late');

-- Direct database verification.
SELECT * FROM lab10.students;

SELECT
  a.id,
  a.student_id,
  s.first_name,
  s.last_name,
  a.attendance_date,
  a.status
FROM lab10.attendance AS a
JOIN lab10.students AS s
  ON s.student_id = a.student_id
ORDER BY a.id;