BEGIN;
CREATE SCHEMA IF NOT EXISTS faculty_dashboard;

CREATE TABLE IF NOT EXISTS faculty_dashboard.accounts (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('faculty', 'student')),
    password_salt TEXT NOT NULL,
    password_hash TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS faculty_dashboard.sections (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    instructor_id INTEGER NOT NULL REFERENCES faculty_dashboard.accounts(id),
    meeting_days TEXT NOT NULL,
    starts_at TIME NOT NULL,
    ends_at TIME NOT NULL CHECK (ends_at > starts_at),
    location TEXT NOT NULL
);

-- These classroom fixtures are separate from the editable Lab 10 student records.
CREATE TABLE IF NOT EXISTS faculty_dashboard.students (
    id INTEGER PRIMARY KEY,
    full_name TEXT NOT NULL,
    major TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS faculty_dashboard.enrollments (
    section_id TEXT REFERENCES faculty_dashboard.sections(id),
    student_id INTEGER REFERENCES faculty_dashboard.students(id),
    PRIMARY KEY (section_id, student_id)
);

CREATE TABLE IF NOT EXISTS faculty_dashboard.attendance (
    section_id TEXT,
    student_id INTEGER,
    meeting_date DATE,
    status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
    PRIMARY KEY (section_id, student_id, meeting_date),
    FOREIGN KEY (section_id, student_id) REFERENCES faculty_dashboard.enrollments(section_id, student_id)
);

CREATE TABLE IF NOT EXISTS faculty_dashboard.scores (
    section_id TEXT,
    student_id INTEGER,
    item TEXT,
    possible NUMERIC NOT NULL CHECK (possible > 0),
    earned NUMERIC NOT NULL CHECK (earned BETWEEN 0 AND possible),
    PRIMARY KEY (section_id, student_id, item),
    FOREIGN KEY (section_id, student_id) REFERENCES faculty_dashboard.enrollments(section_id, student_id)
);
COMMIT;
