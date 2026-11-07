
-- Create the student_dashboard schema if it does not already exist.
CREATE SCHEMA IF NOT EXISTS student_dashboard;

-- Create a table to store available majors and their unique codes.
CREATE TABLE student_dashboard.majors (
    id SERIAL PRIMARY KEY,
    code VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(100) UNIQUE NOT NULL
);

-- Create a table to store student information.
-- Each student is linked to a major through a foreign key.
CREATE TABLE student_dashboard.students (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(60) NOT NULL,
    last_name VARCHAR(60) NOT NULL,
    email VARCHAR(254) UNIQUE NOT NULL,
    major_id INTEGER NOT NULL REFERENCES student_dashboard.majors(id),
    enrollment_year INTEGER NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create a table to store courses and their credit hours.
-- Credit hours must be greater than zero.
CREATE TABLE student_dashboard.courses (
    id SERIAL PRIMARY KEY,
    course_code VARCHAR(20) UNIQUE NOT NULL,
    course_name VARCHAR(150) NOT NULL,
    credit_hours INTEGER NOT NULL CHECK (credit_hours > 0)
);

-- Create a table to track student enrollments in courses.
-- Foreign keys link students and courses, while the UNIQUE constraint
-- prevents duplicate enrollments in the same semester.
CREATE TABLE student_dashboard.enrollments (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES student_dashboard.students(id),
    course_id INTEGER NOT NULL REFERENCES student_dashboard.courses(id),
    semester VARCHAR(30) NOT NULL,
    grade VARCHAR(3),
    UNIQUE (student_id, course_id, semester)
);
