CREATE TABLE students (
  student_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  major TEXT NOT NULL
);
INSERT INTO students (first_name, last_name, major)
VALUES
  ('Avery', 'Morgan', 'Computer Science'),
  ('Jordan', 'Bennett', 'Information Systems'),
  ('Taylor', 'Reed', 'Business Administration');
SELECT * FROM students ORDER BY student_id;
