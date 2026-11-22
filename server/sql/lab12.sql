BEGIN;

CREATE SCHEMA IF NOT EXISTS lab12;

CREATE TABLE IF NOT EXISTS lab12.courses (
  code TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  faculty_username TEXT NOT NULL,
  meeting_time TEXT NOT NULL,
  room TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS lab12.enrollments (
  course_code TEXT REFERENCES lab12.courses(code),
  student_id VARCHAR(4) REFERENCES lab10.students(student_id),
  PRIMARY KEY (course_code, student_id)
);

CREATE TABLE IF NOT EXISTS lab12.class_attendance (
  id SERIAL PRIMARY KEY,
  course_code TEXT NOT NULL,
  student_id VARCHAR(4) NOT NULL,
  attendance_date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late')),
  FOREIGN KEY (course_code, student_id) REFERENCES lab12.enrollments(course_code, student_id),
  UNIQUE (course_code, student_id, attendance_date)
);

CREATE TABLE IF NOT EXISTS lab12.grading_tasks (
  id INTEGER PRIMARY KEY,
  course_code TEXT NOT NULL,
  student_id VARCHAR(4) NOT NULL,
  assignment TEXT NOT NULL,
  reviewed_at TIMESTAMPTZ,
  FOREIGN KEY (course_code, student_id) REFERENCES lab12.enrollments(course_code, student_id)
);

INSERT INTO lab12.courses VALUES
  ('CSC101', 'Introduction to Computing', 'faculty', 'Monday and Wednesday, 9:00 AM', 'Room 102'),
  ('CSC205', 'Web Development', 'faculty', 'Tuesday and Thursday, 1:00 PM', 'Lab 204'),
  ('BUS110', 'Introduction to Business', 'other-faculty', 'Friday, 10:00 AM', 'Room 105')
ON CONFLICT DO NOTHING;

INSERT INTO lab12.enrollments VALUES
  ('CSC101', '1001'), ('CSC101', '1002'), ('CSC205', '1001'), ('BUS110', '1003')
ON CONFLICT DO NOTHING;

INSERT INTO lab12.class_attendance (course_code, student_id, attendance_date, status) VALUES
  ('CSC101', '1001', '2026-11-16', 'present'),
  ('CSC101', '1002', '2026-11-16', 'absent'),
  ('CSC205', '1001', '2026-11-17', 'late'),
  ('BUS110', '1003', '2026-11-13', 'present')
ON CONFLICT DO NOTHING;

INSERT INTO lab12.grading_tasks (id, course_code, student_id, assignment) VALUES
  (1, 'CSC101', '1001', 'Computing concepts worksheet'),
  (2, 'CSC205', '1001', 'Responsive layout exercise'),
  (3, 'BUS110', '1003', 'Business case review')
ON CONFLICT DO NOTHING;

COMMIT;
