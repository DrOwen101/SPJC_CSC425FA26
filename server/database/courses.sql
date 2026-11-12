CREATE TABLE IF NOT EXISTS students.courses (
    crn integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY, -- Course Registration/Registration Number
    semester varchar(11) NOT NULL CHECK (length(btrim(semester)) > 0), -- Fall/Winter/Spring/Summer + Year
    subject varchar(4) NOT NULL CHECK (upper(subject) = subject) CHECK (length(btrim(subject)) > 0), -- 4 letter subject name; e.g. BLAW for Business Law. Must be uppercase. When combined with courseNumber and sectionNumber, it makes up the course code, formatted as SSSScNcNcNcN-sNsN or SSSS cNcNcNcN-sNsN, e.g. BLAW 2014-01
    courseNumber varchar(4) NOT NULL CHECK (length(btrim(courseNumber)) > 0), -- 4 numbers, varchar to be able to combine with subject and sectionNumber to form the course code, formatted as SSSScNcNcNcN-sNsN or SSSS cNcNcNcN-sNsN, e.g. BLAW 2014-01
    sectionNumber varchar(2) NOT NULL CHECK (length(btrim(sectionNumber)) > 0), -- Typically a two digit number, change varchar number for school preference. When combined with subject and courseNumber, it makes up the course code, formatted as SSSScNcNcNcN-sNsN or SSSS cNcNcNcN-sNsN, e.g. BLAW 2014-01
    campus varchar(16) NOT NULL CHECK (length(btrim(campus)) > 0), -- either Online or San Pedro Campus
    creditHours integer, -- 1 digit number. Represents how many credits the course is worth
    courseTitle varchar(50) NOT NULL CHECK (length(btrim(courseTitle)) > 0), -- Name of the course, e.g. Business Law. Called course description on the SPJC website
    days varchar(5) NOT NULL CHECK (upper(days) = days) CHECK (length(btrim(days)) > 0), -- Day(s) the course is on. Must be uppercase. R for Thursday. All week days would be MTWRF. Adjust varchar number if course happens on all days including weekends. ARR if online course
    time varchar(20) NOT NULL CHECK (length(btrim(time)) > 0),  -- time the course is at, e.g. 10:30 AM - 11:20 AM. ARR if online course
    seats integer, -- how many seats are available in the course
    instructor varchar(50) NOT NULL CHECK (length(btrim(instructor)) > 0), -- name of the instructor
    courseDescription varchar(200) NOT NULL CHECK (length(btrim(courseDescription)) > 0),  -- information/description about the course. Includes prerequisites and restrictions
    restrictions varchar(50) -- restrictions to registering for the class
)