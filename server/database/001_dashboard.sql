CREATE SCHEMA IF NOT EXISTS student_dashboard;
CREATE TABLE student_dashboard.students (
  student_id varchar(4) PRIMARY KEY CHECK (student_id ~ '^[0-9]{4}$'),
  first_name varchar(80) NOT NULL CHECK (length(trim(first_name)) > 0),
  last_name varchar(80) NOT NULL CHECK (length(trim(last_name)) > 0),
  major varchar(120) NOT NULL CHECK (length(trim(major)) > 0)
);
CREATE TABLE student_dashboard.courses (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  course_code varchar(20) UNIQUE NOT NULL CHECK (length(trim(course_code)) > 0),
  course_title varchar(160) NOT NULL CHECK (length(trim(course_title)) > 0),
  credit_hours integer NOT NULL CHECK (credit_hours BETWEEN 1 AND 12)
);
CREATE TABLE student_dashboard.enrollments (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  student_id varchar(4) NOT NULL REFERENCES student_dashboard.students ON DELETE CASCADE,
  course_id integer NOT NULL REFERENCES student_dashboard.courses ON DELETE RESTRICT,
  term varchar(60) NOT NULL CHECK (length(trim(term)) > 0),
  status varchar(12) NOT NULL CHECK (status IN ('upcoming', 'completed')),
  grade varchar(2) CHECK (grade IN ('A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'F')),
  meeting_time varchar(120) NOT NULL DEFAULT '',
  location varchar(120) NOT NULL DEFAULT '',
  UNIQUE(student_id, course_id, term),
  CHECK ((status = 'completed' AND grade IS NOT NULL) OR (status = 'upcoming' AND grade IS NULL))
);
CREATE INDEX enrollments_course_idx ON student_dashboard.enrollments(course_id);
CREATE TABLE student_dashboard.attendance (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  enrollment_id integer NOT NULL REFERENCES student_dashboard.enrollments ON DELETE CASCADE,
  attendance_date date NOT NULL,
  status varchar(10) NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
  UNIQUE(enrollment_id, attendance_date)
);
CREATE TABLE student_dashboard.alerts (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  student_id varchar(4) NOT NULL REFERENCES student_dashboard.students ON DELETE CASCADE,
  message varchar(500) NOT NULL CHECK (length(trim(message)) > 0),
  due_date date,
  is_read boolean NOT NULL DEFAULT false
);
CREATE INDEX alerts_student_idx ON student_dashboard.alerts(student_id);
CREATE TABLE student_dashboard.gpa_entries (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  student_id varchar(4) NOT NULL REFERENCES student_dashboard.students ON DELETE CASCADE,
  grade varchar(2) NOT NULL CHECK (grade IN ('A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'F'))
);
CREATE INDEX gpa_entries_student_idx ON student_dashboard.gpa_entries(student_id);
