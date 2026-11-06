CREATE SCHEMA IF NOT EXISTS student_records;

CREATE TABLE IF NOT EXISTS student_records.majors (
    id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    code varchar(10) NOT NULL UNIQUE CHECK (code ~ '^[A-Z]{2,4}$'),
    name varchar(100) NOT NULL UNIQUE CHECK (length(btrim(name)) > 0)
);

CREATE TABLE IF NOT EXISTS student_records.students (
    id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    first_name varchar(50) NOT NULL CHECK (length(btrim(first_name)) > 0),
    last_name varchar(50) NOT NULL CHECK (length(btrim(last_name)) > 0),
    email varchar(100) NOT NULL UNIQUE CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z]{2,}$'),
    major_id integer NOT NULL REFERENCES student_records.majors(id) ON DELETE RESTRICT,
    enrollment_year integer NOT NULL CHECK (enrollment_year BETWEEN 2000 AND 2100),
    is_active boolean NOT NULL DEFAULT TRUE,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS students_major_id_idx ON student_records.students(major_id);


