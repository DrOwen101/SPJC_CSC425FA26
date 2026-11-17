-- Enroll fictional students in Alex Carter's CSC101 section.
INSERT INTO faculty_dashboard.section_enrollments (
    section_id,
    student_id
)
VALUES
    (1, 1),
    (1, 2),
    (1, 5),
    (1, 6)
ON CONFLICT (section_id, student_id) DO NOTHING;