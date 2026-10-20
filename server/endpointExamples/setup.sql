-- Instructor preparation: run in the csc425fa26 database before the demo.
-- This separate schema keeps the example apart from other course tables.
BEGIN;

CREATE SCHEMA IF NOT EXISTS endpoint_examples;

CREATE TABLE IF NOT EXISTS endpoint_examples.students (
  student_id INTEGER GENERATED ALWAYS AS IDENTITY (START WITH 1006) PRIMARY KEY,
  first_name TEXT NOT NULL CHECK (btrim(first_name) <> ''),
  last_name TEXT NOT NULL CHECK (btrim(last_name) <> ''),
  major TEXT NOT NULL CHECK (btrim(major) <> '')
);

-- Fixed seed IDs make rerunning this file safe without resetting saved students.
INSERT INTO endpoint_examples.students (student_id, first_name, last_name, major)
OVERRIDING SYSTEM VALUE
VALUES
  (1001, 'Avery', 'Morgan', 'Computer Science'),
  (1002, 'Jordan', 'Bennett', 'Information Systems'),
  (1003, 'Taylor', 'Reed', 'Business Administration'),
  (1004, 'Cameron', 'Brooks', 'Mathematics'),
  (1005, 'Riley', 'Parker', 'Computer Science')
ON CONFLICT (student_id) DO NOTHING;

COMMIT;
