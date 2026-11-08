-- Lab 10 schema: majors and students in the student_dashboard schema.
-- Run with: psql -U postgres -d csc425_practice -f server/db/schema.sql
-- Running it again keeps any tables that already exist.

CREATE SCHEMA IF NOT EXISTS student_dashboard;

-- One major can have many students.
CREATE TABLE IF NOT EXISTS student_dashboard.majors (
  id   integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code varchar(10)  NOT NULL UNIQUE CHECK (code ~ '^[A-Z]{2,10}$'),
  name varchar(100) NOT NULL UNIQUE CHECK (btrim(name) <> '')
);

-- Each student belongs to exactly one major (the foreign key).
CREATE TABLE IF NOT EXISTS student_dashboard.students (
  id              integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  first_name      varchar(60)  NOT NULL CHECK (btrim(first_name) <> ''),
  last_name       varchar(60)  NOT NULL CHECK (btrim(last_name) <> ''),
  email           varchar(254) NOT NULL UNIQUE CHECK (email = lower(email) AND email LIKE '%_@_%._%'),
  major_id        integer      NOT NULL REFERENCES student_dashboard.majors (id) ON DELETE RESTRICT,
  enrollment_year integer      NOT NULL CHECK (enrollment_year BETWEEN 2000 AND 2100),
  is_active       boolean      NOT NULL DEFAULT true,
  created_at      timestamptz  NOT NULL DEFAULT now(),
  updated_at      timestamptz  NOT NULL DEFAULT now()
);

-- Speeds up joining students to their major.
CREATE INDEX IF NOT EXISTS students_major_id_idx ON student_dashboard.students (major_id);
