import pg from 'pg'

const { Pool } = pg

export const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
})

export async function checkDatabase() {
  const result = await pool.query('SELECT NOW() AS current_time')
  return result.rows[0]
}

// For Attendance component
export async function ensureAttendanceTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS attendance_records (
      id SERIAL PRIMARY KEY,
      student_id VARCHAR(20) NOT NULL,
      course_code VARCHAR(30) NOT NULL,
      attendance_date DATE NOT NULL,
      status VARCHAR(20) NOT NULL,
      recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (student_id, course_code, attendance_date),
      CHECK (status IN ('Present', 'Absent', 'Excused'))
    )
  `)
}

// For ScheduleFaculty component
export async function ensureFacultyTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS faculty (
      faculty_id VARCHAR(20) PRIMARY KEY,
      first_name VARCHAR(50) NOT NULL,
      last_name VARCHAR(50) NOT NULL,
      email VARCHAR(150) UNIQUE
    )
  `)
}

export async function ensureCoursesTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS courses (
      course_id SERIAL PRIMARY KEY,
      course_code VARCHAR(30) NOT NULL UNIQUE,
      course_title VARCHAR(100) NOT NULL,
      credit_hours INTEGER NOT NULL
    )
  `)

  await pool.query(`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = current_schema()
          AND table_name = 'courses'
          AND column_name = 'course_name'
      ) AND NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = current_schema()
          AND table_name = 'courses'
          AND column_name = 'course_title'
      ) THEN
        ALTER TABLE courses RENAME COLUMN course_name TO course_title;
      END IF;
    END
    $$
  `)

  await pool.query(`
    ALTER TABLE courses
    ADD COLUMN IF NOT EXISTS credit_hours INTEGER NOT NULL DEFAULT 3
  `)
}
// Table defines the course being taught, who teaches it, what term it's in, and what section.
export async function ensureCourseSectionsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS course_sections (
      section_id SERIAL PRIMARY KEY,
      course_id INTEGER NOT NULL REFERENCES courses(course_id),
      faculty_id VARCHAR(20) NOT NULL REFERENCES faculty(faculty_id),
      term VARCHAR(30) NOT NULL,
      section_number VARCHAR(20) NOT NULL,
      delivery_mode VARCHAR(20) NOT NULL,
      UNIQUE (course_id, term, section_number)
    )
  `)
}

export async function ensureScheduleEntriesTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schedule_entries (
      schedule_id SERIAL PRIMARY KEY,
      section_id INTEGER NOT NULL REFERENCES course_sections(section_id),
      meeting_day SMALLINT NOT NULL,
      start_time TIME NOT NULL,
      end_time TIME NOT NULL,
      building VARCHAR(50),
      room VARCHAR(20),
      effective_start DATE NOT NULL,
      effective_end DATE NOT NULL,
      CHECK (meeting_day BETWEEN 1 AND 7),
      CHECK (end_time > start_time)
    )
  `)
}

export async function ensureFacultyScheduleTables() {
  await ensureFacultyTable()
  await ensureCoursesTable()
  await ensureCourseSectionsTable()
  await ensureScheduleEntriesTable()

  await pool.query(`
    INSERT INTO faculty (faculty_id, first_name, last_name)
    VALUES
      ('F001', 'John', 'Smith'),
      ('F002', 'Emily', 'Johnson'),
      ('F003', 'Michael', 'Williams'),
      ('F004', 'Sarah', 'Brown')
    ON CONFLICT (faculty_id) DO NOTHING
  `)

  await pool.query(`
    INSERT INTO courses (course_code, course_title, credit_hours)
    VALUES
      ('CSC101', 'Introduction to Computing', 3),
      ('CSC425', 'Web-Based Services and Applications', 3),
      ('IS210', 'Database Systems', 3),
      ('BUS301', 'Business Administration', 3),
      ('MATH220', 'Discrete Mathematics', 3)
    ON CONFLICT (course_code) DO NOTHING
  `)

  await pool.query(`
    INSERT INTO course_sections
      (course_id, faculty_id, term, section_number, delivery_mode)
    SELECT course_id, 'F001', 'Fall 2026', '101', 'In Person'
    FROM courses WHERE course_code = 'CSC425'
    ON CONFLICT (course_id, term, section_number) DO NOTHING
  `)

  await pool.query(`
    INSERT INTO schedule_entries
      (section_id, meeting_day, start_time, end_time, building, room,
       effective_start, effective_end)
    SELECT cs.section_id, 1, '09:00', '10:15', 'Science Building', '204',
           '2026-08-24', '2026-12-18'
    FROM course_sections AS cs
    WHERE cs.faculty_id = 'F001' AND cs.term = 'Fall 2026'
      AND cs.section_number = '101'
      AND NOT EXISTS (
        SELECT 1
        FROM schedule_entries AS se
        WHERE se.section_id = cs.section_id
          AND se.meeting_day = 1
          AND se.start_time = '09:00'
          AND se.end_time = '10:15'
          AND se.building = 'Science Building'
          AND se.room = '204'
          AND se.effective_start = '2026-08-24'
          AND se.effective_end = '2026-12-18'
      )
    ON CONFLICT DO NOTHING
  `)

  await pool.query(`
    INSERT INTO schedule_entries
      (section_id, meeting_day, start_time, end_time, building, room,
       effective_start, effective_end)
    SELECT cs.section_id, 3, '09:00', '10:15', 'Science Building', '204',
           '2026-08-24', '2026-12-18'
    FROM course_sections AS cs
    WHERE cs.faculty_id = 'F001' AND cs.term = 'Fall 2026'
      AND cs.section_number = '101'
      AND NOT EXISTS (
        SELECT 1
        FROM schedule_entries AS se
        WHERE se.section_id = cs.section_id
          AND se.meeting_day = 3
          AND se.start_time = '09:00'
          AND se.end_time = '10:15'
          AND se.building = 'Science Building'
          AND se.room = '204'
          AND se.effective_start = '2026-08-24'
          AND se.effective_end = '2026-12-18'
      )
    ON CONFLICT DO NOTHING
  `)
}

