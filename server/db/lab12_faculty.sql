-- Lab 12: faculty, courses, sections, enrollments, and demo sign-in accounts.
-- Run AFTER schema.sql and seed.sql:
--   psql -h localhost -U postgres -d csc425_practice -f server/db/lab12_faculty.sql
-- Safe to run again: existing tables and rows are kept.
-- Every person, account, and password here is fictional and for class demos only.

-- crypt() and gen_salt() hash the demo passwords inside PostgreSQL.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Faculty members who teach sections.
CREATE TABLE IF NOT EXISTS student_dashboard.faculty (
  id              integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  employee_number varchar(10)  NOT NULL UNIQUE CHECK (employee_number ~ '^E[0-9]{4}$'),
  first_name      varchar(60)  NOT NULL CHECK (btrim(first_name) <> ''),
  last_name       varchar(60)  NOT NULL CHECK (btrim(last_name) <> ''),
  email           varchar(254) NOT NULL UNIQUE CHECK (email = lower(email))
);

CREATE TABLE IF NOT EXISTS student_dashboard.courses (
  id           integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  course_code  varchar(10)  NOT NULL UNIQUE CHECK (course_code ~ '^[A-Z]{2,4} [0-9]{3}$'),
  title        varchar(100) NOT NULL CHECK (btrim(title) <> ''),
  credit_hours integer      NOT NULL CHECK (credit_hours BETWEEN 1 AND 6)
);

-- One course can have many sections. Each section has one instructor.
CREATE TABLE IF NOT EXISTS student_dashboard.course_sections (
  id             integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  course_id      integer    NOT NULL REFERENCES student_dashboard.courses (id) ON DELETE RESTRICT,
  term_code      varchar(4) NOT NULL CHECK (term_code ~ '^(FA|SP|SU)[0-9]{2}$'),
  section_number varchar(3) NOT NULL CHECK (section_number ~ '^[0-9]{2}$'),
  instructor_id  integer    NOT NULL REFERENCES student_dashboard.faculty (id) ON DELETE RESTRICT,
  UNIQUE (course_id, term_code, section_number)
);

-- A student's place in one section, with the final grade the instructor posts.
-- ON DELETE CASCADE keeps the Lab 10 "delete student" feature working.
CREATE TABLE IF NOT EXISTS student_dashboard.enrollments (
  id              integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  student_id      integer     NOT NULL REFERENCES student_dashboard.students (id) ON DELETE CASCADE,
  section_id      integer     NOT NULL REFERENCES student_dashboard.course_sections (id) ON DELETE RESTRICT,
  final_grade     varchar(2)  CHECK (final_grade IN ('A+','A','A-','B+','B','B-','C+','C','C-','D+','D','D-','F')),
  grade_posted_at timestamptz,
  grade_posted_by integer     REFERENCES student_dashboard.faculty (id) ON DELETE RESTRICT,
  UNIQUE (student_id, section_id),
  -- A posted grade always records who posted it and when.
  CHECK ((final_grade IS NULL) = (grade_posted_at IS NULL) AND (final_grade IS NULL) = (grade_posted_by IS NULL))
);
CREATE INDEX IF NOT EXISTS enrollments_section_id_idx ON student_dashboard.enrollments (section_id);

-- Sign-in accounts. A faculty account links to a faculty row, a student account to a student row.
CREATE TABLE IF NOT EXISTS student_dashboard.app_users (
  id            integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  login_email   varchar(254) NOT NULL UNIQUE CHECK (login_email = lower(login_email)),
  password_hash text         NOT NULL,
  role          varchar(10)  NOT NULL CHECK (role IN ('student', 'faculty')),
  faculty_id    integer UNIQUE REFERENCES student_dashboard.faculty (id) ON DELETE CASCADE,
  student_id    integer UNIQUE REFERENCES student_dashboard.students (id) ON DELETE CASCADE,
  is_active     boolean      NOT NULL DEFAULT true,
  CHECK ((role = 'faculty' AND faculty_id IS NOT NULL AND student_id IS NULL)
      OR (role = 'student' AND student_id IS NOT NULL AND faculty_id IS NULL))
);

-- Signed-in sessions. Only a SHA-256 hash of each token is stored.
CREATE TABLE IF NOT EXISTS student_dashboard.auth_sessions (
  token_hash char(64)    PRIMARY KEY,
  user_id    integer     NOT NULL REFERENCES student_dashboard.app_users (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL
);

-- ---------- Sample data (fictional) ----------

INSERT INTO student_dashboard.faculty (employee_number, first_name, last_name, email) VALUES
  ('E1001', 'Morgan', 'Ellis', 'morgan.ellis@example.edu'),
  ('E1002', 'Casey',  'Hart',  'casey.hart@example.edu')
ON CONFLICT (employee_number) DO NOTHING;

INSERT INTO student_dashboard.courses (course_code, title, credit_hours) VALUES
  ('CSC 425', 'Web Application Development', 3),
  ('CIS 210', 'Database Basics', 3),
  ('BUS 150', 'Business Foundations', 3)
ON CONFLICT (course_code) DO NOTHING;

-- Dr. Ellis teaches CSC 425 and CIS 210. Dr. Hart teaches BUS 150.
INSERT INTO student_dashboard.course_sections (course_id, term_code, section_number, instructor_id)
SELECT c.id, 'FA26', '01', f.id
FROM (VALUES ('CSC 425', 'E1001'), ('CIS 210', 'E1001'), ('BUS 150', 'E1002')) AS v (course_code, employee_number)
JOIN student_dashboard.courses c ON c.course_code = v.course_code
JOIN student_dashboard.faculty f ON f.employee_number = v.employee_number
ON CONFLICT (course_id, term_code, section_number) DO NOTHING;

-- Two more fictional students so the rosters have more than one or two people.
INSERT INTO student_dashboard.students (first_name, last_name, email, major_id, enrollment_year, is_active)
SELECT v.first_name, v.last_name, v.email, m.id, v.enrollment_year, true
FROM (VALUES
  ('Riley', 'Parker', 'riley.parker@example.test', 'CSC', 2026),
  ('Dana',  'Price',  'dana.price@example.test',   'CIS', 2025)
) AS v (first_name, last_name, email, major_code, enrollment_year)
JOIN student_dashboard.majors m ON m.code = v.major_code
ON CONFLICT (email) DO NOTHING;

-- Who is enrolled where. Some grades are already posted so the summary has data.
INSERT INTO student_dashboard.enrollments (student_id, section_id, final_grade, grade_posted_at, grade_posted_by)
SELECT s.id, cs.id, v.grade,
       CASE WHEN v.grade IS NULL THEN NULL ELSE now() END,
       CASE WHEN v.grade IS NULL THEN NULL ELSE cs.instructor_id END
FROM (VALUES
  ('avery.morgan@example.test',   'CSC 425', 'A'),
  ('jordan.bennett@example.test', 'CSC 425', 'B+'),
  ('riley.parker@example.test',   'CSC 425', NULL),
  ('dana.price@example.test',     'CSC 425', NULL),
  ('avery.morgan@example.test',   'CIS 210', 'A-'),
  ('riley.parker@example.test',   'CIS 210', NULL),
  ('taylor.reed@example.test',    'BUS 150', 'B'),
  ('dana.price@example.test',     'BUS 150', NULL)
) AS v (email, course_code, grade)
JOIN student_dashboard.students s ON s.email = v.email
JOIN student_dashboard.courses c ON c.course_code = v.course_code
JOIN student_dashboard.course_sections cs ON cs.course_id = c.id AND cs.term_code = 'FA26' AND cs.section_number = '01'
ON CONFLICT (student_id, section_id) DO NOTHING;

-- Demo accounts. Passwords are hashed with bcrypt by crypt() and gen_salt().
INSERT INTO student_dashboard.app_users (login_email, password_hash, role, faculty_id)
SELECT v.login_email, crypt(v.password, gen_salt('bf')), 'faculty', f.id
FROM (VALUES
  ('morgan.ellis@example.edu', 'FacultyDemo1!', 'E1001'),
  ('casey.hart@example.edu',   'FacultyDemo2!', 'E1002')
) AS v (login_email, password, employee_number)
JOIN student_dashboard.faculty f ON f.employee_number = v.employee_number
ON CONFLICT (login_email) DO NOTHING;

INSERT INTO student_dashboard.app_users (login_email, password_hash, role, student_id)
SELECT 'avery.morgan@example.test', crypt('StudentDemo1!', gen_salt('bf')), 'student', s.id
FROM student_dashboard.students s WHERE s.email = 'avery.morgan@example.test'
ON CONFLICT (login_email) DO NOTHING;

-- Check that the data was saved:
SELECT c.course_code || '-' || cs.section_number AS section, f.last_name AS instructor,
       s.first_name || ' ' || s.last_name AS student, e.final_grade
FROM student_dashboard.enrollments e
JOIN student_dashboard.course_sections cs ON cs.id = e.section_id
JOIN student_dashboard.courses c ON c.id = cs.course_id
JOIN student_dashboard.faculty f ON f.id = cs.instructor_id
JOIN student_dashboard.students s ON s.id = e.student_id
ORDER BY section, s.last_name;
