CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS student_dashboard.faculty (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  first_name varchar(60) NOT NULL CHECK (length(btrim(first_name)) > 0),
  last_name varchar(60) NOT NULL CHECK (length(btrim(last_name)) > 0),
  email varchar(254) NOT NULL UNIQUE CHECK (email = lower(btrim(email))),
  password_hash text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS student_dashboard.faculty_sessions (
  token_hash text PRIMARY KEY,
  faculty_id integer NOT NULL REFERENCES student_dashboard.faculty(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS student_dashboard.courses (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code varchar(20) NOT NULL UNIQUE CHECK (length(btrim(code)) > 0),
  title varchar(120) NOT NULL CHECK (length(btrim(title)) > 0),
  credit_hours integer NOT NULL CHECK (credit_hours BETWEEN 1 AND 6)
);

CREATE TABLE IF NOT EXISTS student_dashboard.course_sections (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  course_id integer NOT NULL REFERENCES student_dashboard.courses(id) ON DELETE RESTRICT,
  term varchar(30) NOT NULL CHECK (length(btrim(term)) > 0),
  section_number varchar(10) NOT NULL CHECK (length(btrim(section_number)) > 0),
  faculty_id integer NOT NULL REFERENCES student_dashboard.faculty(id) ON DELETE RESTRICT,
  UNIQUE (course_id, term, section_number)
);

-- CASCADE on student_id keeps the Lab 10 student delete working for enrolled students.
CREATE TABLE IF NOT EXISTS student_dashboard.enrollments (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  section_id integer NOT NULL REFERENCES student_dashboard.course_sections(id) ON DELETE RESTRICT,
  student_id integer NOT NULL REFERENCES student_dashboard.students(id) ON DELETE CASCADE,
  final_grade varchar(1) CHECK (final_grade IN ('A', 'B', 'C', 'D', 'F')),
  grade_posted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (section_id, student_id),
  CHECK ((final_grade IS NULL) = (grade_posted_at IS NULL))
);

CREATE TABLE IF NOT EXISTS student_dashboard.attendance_records (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  enrollment_id integer NOT NULL REFERENCES student_dashboard.enrollments(id) ON DELETE CASCADE,
  class_date date NOT NULL,
  status varchar(10) NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
  recorded_by integer NOT NULL REFERENCES student_dashboard.faculty(id) ON DELETE RESTRICT,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (enrollment_id, class_date)
);

CREATE INDEX IF NOT EXISTS course_sections_faculty_idx ON student_dashboard.course_sections(faculty_id);
CREATE INDEX IF NOT EXISTS enrollments_student_idx ON student_dashboard.enrollments(student_id);
CREATE INDEX IF NOT EXISTS attendance_recorded_by_idx ON student_dashboard.attendance_records(recorded_by);