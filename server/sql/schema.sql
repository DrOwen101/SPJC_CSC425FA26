
-- CSC 425 Module 10
-- PostgreSQL Database Schema

-- Table 1: Students
CREATE TABLE IF NOT EXISTS students (
    student_id INTEGER PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL
);
-- Table 2: Enrollments
CREATE TABLE IF NOT EXISTS enrollments (
    enrollment_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    student_id INTEGER NOT NULL,
    course_code VARCHAR(20) NOT NULL,
    grade VARCHAR(2),

    CONSTRAINT fk_student
        FOREIGN KEY (student_id)
        REFERENCES students(student_id)
);
