-- Run inside the studentdashboard database, not the postgres database.
-- For example: psql -U postgres -h localhost -d studentdashboard -f server/sql/schema.sql
-- Safe to rerun: does not drop tables or existing data.

CREATE TABLE IF NOT EXISTS students (
    student_id VARCHAR(4) PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    major VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS enrollments (
    enrollment_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    student_id VARCHAR(4) NOT NULL,
    course_code VARCHAR(20) NOT NULL,
    semester VARCHAR(30) NOT NULL,
    grade VARCHAR(2),
    CONSTRAINT enrollments_student_id_fkey
        FOREIGN KEY (student_id)
        REFERENCES students(student_id)
        ON DELETE CASCADE
);
