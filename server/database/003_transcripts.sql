-- Course snapshots preserve the title and credit hours awarded at the time.
CREATE TABLE IF NOT EXISTS student_dashboard.transcript_courses (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  student_id integer NOT NULL REFERENCES student_dashboard.students(id) ON DELETE RESTRICT,
  institution varchar(150) NOT NULL CHECK (length(btrim(institution)) > 0),
  term varchar(60) NOT NULL CHECK (length(btrim(term)) > 0),
  term_start date NOT NULL,
  course_code varchar(20) NOT NULL CHECK (length(btrim(course_code)) > 0),
  course_title varchar(150) NOT NULL CHECK (length(btrim(course_title)) > 0),
  credit_hours smallint NOT NULL CHECK (credit_hours BETWEEN 1 AND 12),
  grade varchar(2) NOT NULL CHECK (grade IN ('A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'F')),
  is_sample boolean NOT NULL DEFAULT false,
  UNIQUE (student_id, term_start, course_code)
);
-- The unique index starts with student_id and also covers its foreign key.
