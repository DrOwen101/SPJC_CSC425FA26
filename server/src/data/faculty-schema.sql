-- Run this file in pgAdmin after the students and academic_records tables exist.
-- It makes demo course sections from the course records already in the database.

BEGIN;

CREATE TABLE IF NOT EXISTS faculty_members (
  faculty_id VARCHAR(30) PRIMARY KEY,
  display_name VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS course_sections (
  section_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  course_code VARCHAR(12) NOT NULL,
  term VARCHAR(20) NOT NULL,
  section_name VARCHAR(10) NOT NULL DEFAULT '001',
  UNIQUE (course_code, term, section_name)
);

CREATE TABLE IF NOT EXISTS faculty_course_assignments (
  faculty_id VARCHAR(30) NOT NULL REFERENCES faculty_members(faculty_id) ON DELETE CASCADE,
  section_id BIGINT NOT NULL REFERENCES course_sections(section_id) ON DELETE CASCADE,
  PRIMARY KEY (faculty_id, section_id)
);

CREATE TABLE IF NOT EXISTS course_enrollments (
  section_id BIGINT NOT NULL REFERENCES course_sections(section_id) ON DELETE CASCADE,
  student_id VARCHAR(4) NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
  PRIMARY KEY (section_id, student_id)
);

INSERT INTO faculty_members (faculty_id, display_name)
VALUES ('demo-faculty', 'Demo Faculty')
ON CONFLICT (faculty_id) DO NOTHING;

INSERT INTO course_sections (course_code, term, section_name)
SELECT DISTINCT course_code, term, '001'
FROM academic_records
ON CONFLICT (course_code, term, section_name) DO NOTHING;

INSERT INTO faculty_course_assignments (faculty_id, section_id)
SELECT 'demo-faculty', section_id
FROM course_sections
ON CONFLICT (faculty_id, section_id) DO NOTHING;

INSERT INTO course_enrollments (section_id, student_id)
SELECT section.section_id, record.student_id
FROM course_sections AS section
JOIN academic_records AS record
  ON record.course_code = section.course_code
 AND record.term = section.term
ON CONFLICT (section_id, student_id) DO NOTHING;

COMMIT;
