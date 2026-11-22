-- CSC425 Lab 12: Small, fictional expansion of EXISTING csc425_practice data.
-- Requires existing student_dashboard, faculty_dashboard, and auth schemas.
-- Keeps Alex Carter's original CSC101 / 001 section and its students unchanged.
-- Re-runnable: uses ON CONFLICT to avoid duplicates. No tables are dropped.
-- WARNING: demo credentials below are intentionally public; never use for real accounts.

\set ON_ERROR_STOP on
BEGIN;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Keep Alex Carter and add Rick Sanchez to faculty profiles.
INSERT INTO faculty_dashboard.faculty (first_name, last_name, email)
VALUES ('Alex', 'Carter', 'alex.carter@example.edu'),
       ('Rick', 'Sanchez', 'rick.sanchez@example.edu')
ON CONFLICT (email) DO NOTHING;

-- 2. Two classroom-only login accounts. Matches your login-page captions.
-- PostgreSQL pgcrypto's bcrypt hashes work with Node bcrypt.compare().
INSERT INTO auth.users (email, password_hash, role_id, faculty_id, is_active)
SELECT f.email,
       crypt(CASE WHEN f.email = 'alex.carter@example.edu'
                  THEN '1234' ELSE 'portal' END, gen_salt('bf', 10)),
       r.id, f.id, TRUE
FROM faculty_dashboard.faculty AS f
JOIN auth.roles AS r ON r.name = 'faculty'
WHERE f.email IN ('alex.carter@example.edu', 'rick.sanchez@example.edu')
ON CONFLICT (email) DO UPDATE
SET password_hash = EXCLUDED.password_hash,
    role_id = EXCLUDED.role_id,
    faculty_id = EXCLUDED.faculty_id,
    is_active = TRUE;

-- 3. Add three courses without overwriting the original courses.
INSERT INTO student_dashboard.courses (course_code, course_name, credit_hours)
VALUES ('CSC425', 'Web Application and Service Development', 3),
       ('CSC508', 'Deep Learning', 3),
       ('STA265', 'Applied Statistics', 3)
ON CONFLICT (course_code) DO NOTHING;

-- 4. Eight fictional students. Uses a pre-existing Computer Science major.
INSERT INTO student_dashboard.students
    (first_name, last_name, email, major_id, enrollment_year, is_active)
SELECT v.first_name, v.last_name, v.email, m.id, 2025, TRUE
FROM (VALUES
    ('Jordan','Miller','jordan.miller.lab12@example.edu'),
    ('Taylor','Nguyen','taylor.nguyen.lab12@example.edu'),
    ('Morgan','Rivera','morgan.rivera.lab12@example.edu'),
    ('Casey','Patel','casey.patel.lab12@example.edu'),
    ('Avery','Johnson','avery.johnson.lab12@example.edu'),
    ('Parker','Reed','parker.reed.lab12@example.edu'),
    ('Dakota','Lee','dakota.lee.lab12@example.edu'),
    ('Cameron','Davis','cameron.davis.lab12@example.edu')
) AS v(first_name,last_name,email)
JOIN student_dashboard.majors AS m ON m.code = 'CSC'
ON CONFLICT (email) DO NOTHING;

-- 5. One extra section for Alex; two for Rick.
INSERT INTO faculty_dashboard.sections
    (course_id, faculty_id, semester, section_code)
SELECT c.id, f.id, 'Fall 2026', v.section_code
FROM (VALUES
    ('CSC425', 'alex.carter@example.edu', 'D1'),
    ('CSC508', 'rick.sanchez@example.edu', 'D1'),
    ('STA265', 'rick.sanchez@example.edu', 'D1')
) AS v(course_code, faculty_email, section_code)
JOIN student_dashboard.courses AS c ON c.course_code = v.course_code
JOIN faculty_dashboard.faculty AS f ON f.email = v.faculty_email
ON CONFLICT (course_id, semester, section_code) DO NOTHING;

-- 6. Four students per new section (some students take multiple courses).
INSERT INTO faculty_dashboard.section_enrollments (section_id, student_id)
SELECT sec.id, s.id
FROM (VALUES
    ('CSC425', 'jordan.miller.lab12@example.edu'),
    ('CSC425', 'taylor.nguyen.lab12@example.edu'),
    ('CSC425', 'morgan.rivera.lab12@example.edu'),
    ('CSC425', 'casey.patel.lab12@example.edu'),
    ('CSC508', 'morgan.rivera.lab12@example.edu'),
    ('CSC508', 'avery.johnson.lab12@example.edu'),
    ('CSC508', 'parker.reed.lab12@example.edu'),
    ('CSC508', 'dakota.lee.lab12@example.edu'),
    ('STA265', 'taylor.nguyen.lab12@example.edu'),
    ('STA265', 'parker.reed.lab12@example.edu'),
    ('STA265', 'dakota.lee.lab12@example.edu'),
    ('STA265', 'cameron.davis.lab12@example.edu')
) AS v(course_code, student_email)
JOIN student_dashboard.courses AS c ON c.course_code = v.course_code
JOIN faculty_dashboard.sections AS sec
    ON sec.course_id = c.id AND sec.semester = 'Fall 2026'
   AND sec.section_code = 'D1'
JOIN student_dashboard.students AS s ON s.email = v.student_email
ON CONFLICT (section_id, student_id) DO NOTHING;

-- 7. Just ONE graded Quiz 1 per new section, plus an ungraded Final Project.
INSERT INTO faculty_dashboard.assessments (section_id, assessment_name, max_points)
SELECT sec.id, v.assessment_name, v.max_points
FROM faculty_dashboard.sections AS sec
JOIN student_dashboard.courses AS c ON c.id = sec.course_id
CROSS JOIN (VALUES
    ('Quiz 1', 20.00::numeric),
    ('Final Project', 100.00::numeric)
) AS v(assessment_name, max_points)
WHERE sec.semester = 'Fall 2026' AND sec.section_code = 'D1'
  AND c.course_code IN ('CSC425', 'CSC508', 'STA265')
ON CONFLICT (section_id, assessment_name) DO NOTHING;

-- Up to 12 sample grades total, one for each enrollment in the new sections.
INSERT INTO faculty_dashboard.grades
    (section_id, section_enrollment_id, assessment_id, score)
SELECT sec.id, se.id, a.id, (15 + (s.id % 6))::numeric
FROM faculty_dashboard.sections AS sec
JOIN student_dashboard.courses AS c ON c.id = sec.course_id
JOIN faculty_dashboard.section_enrollments AS se ON se.section_id = sec.id
JOIN student_dashboard.students AS s ON s.id = se.student_id
JOIN faculty_dashboard.assessments AS a
    ON a.section_id = sec.id AND a.assessment_name = 'Quiz 1'
WHERE sec.semester = 'Fall 2026' AND sec.section_code = 'D1'
  AND c.course_code IN ('CSC425', 'CSC508', 'STA265')
  AND s.email LIKE '%.lab12@example.edu'
ON CONFLICT (section_enrollment_id, assessment_id) DO NOTHING;

-- 8. One attendance date for each new section.
INSERT INTO faculty_dashboard.attendance (section_enrollment_id, class_date, status)
SELECT se.id, DATE '2026-11-20',
       CASE WHEN s.id % 5 = 0 THEN 'absent' ELSE 'present' END
FROM faculty_dashboard.sections AS sec
JOIN student_dashboard.courses AS c ON c.id = sec.course_id
JOIN faculty_dashboard.section_enrollments AS se ON se.section_id = sec.id
JOIN student_dashboard.students AS s ON s.id = se.student_id
WHERE sec.semester = 'Fall 2026' AND sec.section_code = 'D1'
  AND c.course_code IN ('CSC425', 'CSC508', 'STA265')
  AND s.email LIKE '%.lab12@example.edu'
ON CONFLICT (section_enrollment_id, class_date) DO NOTHING;

COMMIT;

-- Result: both faculty users, all their sections, and student counts.
SELECT f.email AS faculty_email, c.course_code, sec.section_code,
       COUNT(se.student_id) AS enrolled_students
FROM faculty_dashboard.faculty AS f
JOIN faculty_dashboard.sections AS sec ON sec.faculty_id = f.id
JOIN student_dashboard.courses AS c ON c.id = sec.course_id
LEFT JOIN faculty_dashboard.section_enrollments AS se ON se.section_id = sec.id
WHERE f.email IN ('alex.carter@example.edu', 'rick.sanchez@example.edu')
GROUP BY f.email, c.course_code, sec.section_code
ORDER BY f.email, c.course_code;


-- ==========================================
-- Rick Sanchez - Detention Section
-- ==========================================

BEGIN;

-- Create the Detention course.
INSERT INTO student_dashboard.courses
    (course_code, course_name, credit_hours)
VALUES
    ('DET101', 'Detention', 1)
ON CONFLICT (course_code) DO NOTHING;

-- Assign Detention to Rick Sanchez.
INSERT INTO faculty_dashboard.sections
    (course_id, faculty_id, semester, section_code)
SELECT c.id, f.id, 'Fall 2026', '001'
FROM student_dashboard.courses c
JOIN faculty_dashboard.faculty f
    ON f.email = 'rick.sanchez@example.edu'
WHERE c.course_code = 'DET101'
ON CONFLICT (course_id, semester, section_code)
DO NOTHING;

-- Enroll the four existing students.
INSERT INTO faculty_dashboard.section_enrollments
    (section_id, student_id)
SELECT sec.id, s.id
FROM faculty_dashboard.sections sec
JOIN student_dashboard.courses c
    ON c.id = sec.course_id
JOIN student_dashboard.students s
    ON s.email IN (
        'spiderman@example.test',
        'hulk@example.test',
        'sheldon@example.test',
        'jnoback1@example.test'
    )
WHERE c.course_code = 'DET101'
  AND sec.semester = 'Fall 2026'
  AND sec.section_code = '001'
ON CONFLICT (section_id, student_id) DO NOTHING;

-- Add two fictional assessments.
INSERT INTO faculty_dashboard.assessments
    (section_id, assessment_name, max_points)
SELECT sec.id, a.name, a.points
FROM faculty_dashboard.sections sec
JOIN student_dashboard.courses c
    ON c.id = sec.course_id
CROSS JOIN (
    VALUES
        ('Participation', 20),
        ('Reflection', 50)
) AS a(name, points)
WHERE c.course_code = 'DET101'
  AND sec.semester = 'Fall 2026'
  AND sec.section_code = '001'
ON CONFLICT (section_id, assessment_name)
DO NOTHING;

-- Add fictional grades.
INSERT INTO faculty_dashboard.grades
    (section_id, section_enrollment_id, assessment_id, score)
SELECT
    sec.id,
    se.id,
    a.id,
    scores.score
FROM (
    VALUES
        ('spiderman@example.test', 'Participation', 18),
        ('spiderman@example.test', 'Reflection', 44),
        ('hulk@example.test', 'Participation', 16),
        ('hulk@example.test', 'Reflection', 38),
        ('sheldon@example.test', 'Participation', 20),
        ('sheldon@example.test', 'Reflection', 49),
        ('jnoback1@example.test', 'Participation', 19),
        ('jnoback1@example.test', 'Reflection', 46)
) AS scores(email, assessment_name, score)
JOIN student_dashboard.students s
    ON s.email = scores.email
JOIN faculty_dashboard.section_enrollments se
    ON se.student_id = s.id
JOIN faculty_dashboard.sections sec
    ON sec.id = se.section_id
JOIN student_dashboard.courses c
    ON c.id = sec.course_id
JOIN faculty_dashboard.assessments a
    ON a.section_id = sec.id
   AND a.assessment_name = scores.assessment_name
WHERE c.course_code = 'DET101'
  AND sec.semester = 'Fall 2026'
  AND sec.section_code = '001'
ON CONFLICT (section_enrollment_id, assessment_id)
DO NOTHING;

-- Add fictional attendance.
INSERT INTO faculty_dashboard.attendance
    (section_enrollment_id, class_date, status)
SELECT
    se.id,
    DATE '2026-11-20',
    CASE
        WHEN s.email = 'spiderman@example.test'
            THEN 'absent'
        ELSE 'present'
    END
FROM faculty_dashboard.section_enrollments se
JOIN faculty_dashboard.sections sec
    ON sec.id = se.section_id
JOIN student_dashboard.courses c
    ON c.id = sec.course_id
JOIN student_dashboard.students s
    ON s.id = se.student_id
WHERE c.course_code = 'DET101'
  AND sec.semester = 'Fall 2026'
  AND sec.section_code = '001'
ON CONFLICT (section_enrollment_id, class_date)
DO NOTHING;

COMMIT;
