CREATE TABLE IF NOT EXISTS students (
  student_id text PRIMARY KEY CHECK (student_id ~ '^[0-9]{4}$'),
  first_name text NOT NULL,
  last_name text NOT NULL,
  major text NOT NULL
);

CREATE TABLE IF NOT EXISTS transcripts (
  student_id text PRIMARY KEY REFERENCES students(student_id) ON DELETE CASCADE,
  institution text NOT NULL,
  is_mock_data boolean NOT NULL DEFAULT false,
  semesters jsonb NOT NULL,
  summary jsonb NOT NULL
);
