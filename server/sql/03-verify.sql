-- In psql: \set student_id 3   (replace 3 with the ID returned by YOUR create)
SELECT current_database(), current_schema();
SELECT table_schema, table_name FROM information_schema.tables
WHERE table_schema = 'student_dashboard' ORDER BY table_name;
SELECT tc.table_name, tc.constraint_name, tc.constraint_type
FROM information_schema.table_constraints tc
WHERE tc.table_schema = 'student_dashboard'
ORDER BY tc.table_name, tc.constraint_type;

-- Repeat this exact query after create, update, and delete.
SELECT s.*, m.name AS major_name
FROM student_dashboard.students s
JOIN student_dashboard.majors m ON m.id = s.major_id
WHERE s.id = :student_id;

-- After deletion this must be zero.
SELECT COUNT(*) AS matching_records FROM student_dashboard.students WHERE id = :student_id;
