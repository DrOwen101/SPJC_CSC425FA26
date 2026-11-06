CREATE TABLE students (
    studentID INT PRIMARY KEY,
    firstName VARCHAR(50) NOT NULL,
    lastName VARCHAR(50) NOT NULL,
    major VARCHAR(50),
    institution VARCHAR(50)
);

CREATE TABLE courses (
    courseID INT PRIMARY KEY,
    courseCode CHAR(7) NOT NULL,
    courseTitle VARCHAR(50) NOT NULL,
    instructor VARCHAR(50) NOT NULL
);

CREATE TABLE enrollments (
    enrollmentID INT PRIMARY KEY,
    studentID INT,
    courseID INT,
    term VARCHAR(11),
    CONSTRAINT fk_student
    FOREIGN KEY (studentID)
    REFERENCES students(studentID),
    CONSTRAINT fk_course
    FOREIGN KEY (courseID)
    REFERENCES courses(courseID)
);

INSERT INTO students (studentID, firstName, lastName, major, institution) VALUES
    (1001, 'Avery', 'Morgan', 'Computer Science', 'CSC 425 Demo University'),
    (1002, 'Jordan', 'Bennett', 'Information Systems', 'CSC 425 Demo University'),
    (1003, 'Taylor', 'Reed', 'Business Administration', 'CSC 425 Demo University'),
    (1004, 'Cameron', 'Brooks', 'Mathematics', 'CSC 425 Demo University'),
    (1005, 'Riley', 'Parker', 'Computer Science', 'CSC 425 Demo University');

INSERT INTO courses (courseID, courseCode, courseTitle, instructor) VALUES
    (1, 'CSC 101', 'Introduction to Computing', 'Dr. Elena Morales'),
    (2, 'MAT 150', 'College Algebra', 'Professor Marcus Chen'),
    (3, 'ENG 101', 'Composition I', 'Dr. Simone Patel'),
    (4, 'BIO 101', 'General Biology', 'Professor Nathan Brooks'),
    (5, 'CSC 125', 'Introduction to Programming', 'Dr. Priya Shah'),
    (6, 'MAT 250', 'Calculus I', 'Professor Oliver Grant'),
    (7, 'ENG 102', 'Composition II', 'Dr. Camille Foster'),
    (8, 'COM 161', 'Public Speaking', 'Professor Julian Rivera');

INSERT INTO enrollments (enrollmentID, studentID, courseID, term) VALUES
    (1, 1001, 1, 'Fall 2025'),
    (2, 1001, 2, 'Fall 2025'),
    (3, 1001, 3, 'Fall 2025'),
    (4, 1001, 4, 'Fall 2025'),
    (5, 1001, 5, 'Spring 2026'),
    (6, 1001, 6, 'Spring 2026'),
    (7, 1001, 7, 'Spring 2026'),
    (8, 1001, 8, 'Spring 2026'),
    (9, 1002, 1, 'Fall 2025'),
    (10, 1002, 2, 'Fall 2025'),
    (11, 1002, 3, 'Fall 2025'),
    (12, 1002, 4, 'Fall 2025'),
    (13, 1002, 5, 'Spring 2026'),
    (14, 1002, 6, 'Spring 2026'),
    (15, 1002, 7, 'Spring 2026'),
    (16, 1002, 8, 'Spring 2026'),
    (17, 1003, 1, 'Fall 2025'),
    (18, 1003, 2, 'Fall 2025'),
    (19, 1003, 3, 'Fall 2025'),
    (20, 1003, 4, 'Fall 2025'),
    (21, 1003, 5, 'Spring 2026'),
    (22, 1003, 6, 'Spring 2026'),
    (23, 1003, 7, 'Spring 2026'),
    (24, 1003, 8, 'Spring 2026'),
    (25, 1004, 1, 'Fall 2025'),
    (26, 1004, 2, 'Fall 2025'),
    (27, 1004, 3, 'Fall 2025'),
    (28, 1004, 4, 'Fall 2025'),
    (29, 1004, 5, 'Spring 2026'),
    (30, 1004, 6, 'Spring 2026'),
    (31, 1004, 7, 'Spring 2026'),
    (32, 1004, 8, 'Spring 2026'),
    (33, 1005, 1, 'Fall 2025'),
    (34, 1005, 2, 'Fall 2025'),
    (35, 1005, 3, 'Fall 2025'),
    (36, 1005, 4, 'Fall 2025'),
    (37, 1005, 5, 'Spring 2026'),
    (38, 1005, 6, 'Spring 2026'),
    (39, 1005, 7, 'Spring 2026'),
    (40, 1005, 8, 'Spring 2026');
