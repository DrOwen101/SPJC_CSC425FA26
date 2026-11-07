-- Run against csc425_practice. This adds tables without dropping existing data.
BEGIN;
CREATE SCHEMA IF NOT EXISTS student_dashboard;

CREATE TABLE IF NOT EXISTS student_dashboard.majors (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    code VARCHAR(12) NOT NULL UNIQUE CHECK (code ~ '^[A-Z][A-Z0-9_]*$'),
    name VARCHAR(100) NOT NULL UNIQUE CHECK (length(btrim(name)) > 0)
);

CREATE TABLE IF NOT EXISTS student_dashboard.students (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    first_name VARCHAR(80) NOT NULL CHECK (length(btrim(first_name)) > 0),
    last_name VARCHAR(80) NOT NULL CHECK (length(btrim(last_name)) > 0),
    email VARCHAR(254) NOT NULL UNIQUE
        CHECK (email = lower(btrim(email)) AND email ~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'),
    major_id INTEGER NOT NULL REFERENCES student_dashboard.majors(id) ON DELETE RESTRICT,
    enrollment_year SMALLINT NOT NULL CHECK (enrollment_year BETWEEN 1900 AND 2100),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS students_major_id_idx ON student_dashboard.students(major_id);
COMMIT;
