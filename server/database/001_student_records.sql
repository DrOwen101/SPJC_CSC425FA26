-- One major has many students. These tables are separate from earlier labs.
CREATE SCHEMA IF NOT EXISTS student_dashboard;

CREATE TABLE IF NOT EXISTS student_dashboard.majors (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code varchar(10) NOT NULL UNIQUE CHECK (code ~ '^[A-Z][A-Z0-9]{1,9}$'),
  name varchar(100) NOT NULL UNIQUE CHECK (length(btrim(name)) > 0)
);

CREATE TABLE IF NOT EXISTS student_dashboard.students (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  first_name varchar(60) NOT NULL CHECK (length(btrim(first_name)) > 0),
  last_name varchar(60) NOT NULL CHECK (length(btrim(last_name)) > 0),
  email varchar(254) NOT NULL UNIQUE
    CHECK (email = lower(btrim(email)) AND email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
  major_id integer NOT NULL REFERENCES student_dashboard.majors(id) ON DELETE RESTRICT,
  enrollment_year integer NOT NULL CHECK (enrollment_year BETWEEN 2000 AND 2100),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- PostgreSQL does not automatically index the referencing side of a foreign key.
CREATE INDEX IF NOT EXISTS students_major_id_idx ON student_dashboard.students(major_id);
