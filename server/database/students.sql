CREATE SCHEMA IF NOT EXISTS students;

CREATE TABLE IF NOT EXISTS students.students (
    studentID integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    firstName varchar(50) NOT NULL CHECK (length(btrim(firstName)) > 0),
    lastName varchar(50) NOT NULL CHECK (length(btrim(lastName)) > 0),
    major varchar(50) NOT NULL CHECK (length(btrim(major)) > 0),
    courseID integer NOT NULL REFERENCES students.courses(crn),
    email varchar(245) NOT NULL UNIQUE CHECK (email = lower(btrim(email))) AND email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
    enrollmentYear integer NOT NULL CHECK (enrollmentYear BETWEEN 2000 AND 2100),
    isActive BOOLEAN NOT NULL DEFAULT true;
)