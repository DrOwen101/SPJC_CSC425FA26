import { readFile } from 'node:fs/promises'
import { pool } from '../src/db.js'

export async function setupDatabase(database = pool) {
  const client = await database.connect()
  try {
    await client.query('BEGIN')
    // Serialize setup and seed work; a rerun must never reset user edits.
    await client.query('SELECT pg_advisory_xact_lock(4252026)')
    await client.query('CREATE SCHEMA IF NOT EXISTS student_dashboard')
    await client.query('CREATE TABLE IF NOT EXISTS student_dashboard.migrations (version integer PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())')
    const applied = await client.query('SELECT version FROM student_dashboard.migrations WHERE version = 1')
    if (!applied.rowCount) {
      await client.query(await readFile(new URL('./001_dashboard.sql', import.meta.url), 'utf8'))
      const { students } = JSON.parse(await readFile(new URL('../src/data/transcripts.json', import.meta.url), 'utf8'))
      for (const student of students) {
        await client.query('INSERT INTO student_dashboard.students VALUES ($1,$2,$3,$4)', [student.studentID, student.firstName, student.lastName, student.major])
        for (const semester of student.semesters) {
          for (const course of semester.courses) {
            const saved = await client.query(`INSERT INTO student_dashboard.courses (course_code,course_title,credit_hours)
              VALUES ($1,$2,$3) ON CONFLICT (course_code) DO UPDATE SET course_code=EXCLUDED.course_code RETURNING id`,
            [course.courseCode, course.courseTitle, course.creditHours])
            await client.query(`INSERT INTO student_dashboard.enrollments (student_id,course_id,term,status,grade)
              VALUES ($1,$2,$3,'completed',$4)`, [student.studentID, saved.rows[0].id, semester.term, course.grade])
          }
        }
        await client.query(`INSERT INTO student_dashboard.alerts (student_id,message) VALUES ($1,$2)`, [student.studentID, 'Review your course registration with your advisor.'])
      }
      const upcoming = await client.query(`INSERT INTO student_dashboard.courses (course_code,course_title,credit_hours)
        VALUES ('CSC 425','Web-Based Services and Applications',3) ON CONFLICT (course_code) DO UPDATE SET course_code=EXCLUDED.course_code RETURNING id`)
      const enrollment = await client.query(`INSERT INTO student_dashboard.enrollments (student_id,course_id,term,status,meeting_time,location)
        VALUES ('1001',$1,'Fall 2026','upcoming','Tuesday / Thursday 10:00 AM','Computer Lab') RETURNING id`, [upcoming.rows[0].id])
      await client.query(`INSERT INTO student_dashboard.attendance (enrollment_id,attendance_date,status) VALUES ($1,'2026-10-20','present')`, [enrollment.rows[0].id])
      await client.query('INSERT INTO student_dashboard.migrations (version) VALUES (1)')
    }
    await client.query('COMMIT')
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}
