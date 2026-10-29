-- PROPOSAL: fresh-database definitions, not a migration of the current CRUD lab.
-- Run only in a new review database with no student_dashboard schema.
-- CREATE SCHEMA deliberately fails if the existing lab schema is present.
-- No sample data, accounts, or privileges are created by this file.
BEGIN;

CREATE SCHEMA student_dashboard;

-- 1. Login identities; academic profiles may exist before login provisioning.
CREATE TABLE student_dashboard.users (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  login_email varchar(254) NOT NULL UNIQUE,
  auth_provider varchar(50) NOT NULL CHECK (length(btrim(auth_provider)) > 0),
  auth_subject text NOT NULL CHECK (length(btrim(auth_subject)) > 0),
  is_active boolean NOT NULL DEFAULT true,
  last_login_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT users_auth_identity_uq UNIQUE (auth_provider, auth_subject),
  CONSTRAINT users_email_ck CHECK (
    login_email = lower(btrim(login_email))
    AND login_email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
  )
);

-- 2. One account can have multiple application roles.
CREATE TABLE student_dashboard.user_roles (
  user_id integer NOT NULL REFERENCES student_dashboard.users(id) ON DELETE RESTRICT,
  role_code varchar(20) NOT NULL CHECK (role_code IN ('student', 'faculty', 'admin')),
  assigned_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, role_code)
);

-- 3. Academic programs.
CREATE TABLE student_dashboard.majors (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code varchar(10) NOT NULL UNIQUE CHECK (code ~ '^[A-Z][A-Z0-9]{1,9}$'),
  name varchar(100) NOT NULL UNIQUE CHECK (length(btrim(name)) > 0),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Semesters and other dated academic sessions.
CREATE TABLE student_dashboard.academic_terms (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code varchar(20) NOT NULL UNIQUE CHECK (length(btrim(code)) > 0),
  name varchar(80) NOT NULL CHECK (length(btrim(name)) > 0),
  starts_on date NOT NULL,
  ends_on date NOT NULL,
  registration_opens_at timestamptz NOT NULL,
  registration_closes_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT academic_terms_dates_ck CHECK (ends_on >= starts_on),
  CONSTRAINT academic_terms_registration_ck CHECK (registration_closes_at >= registration_opens_at)
);

-- 5. Academic student profiles; nullable major means undeclared.
-- enrollment_year is omitted in this target schema in favor of admission_term_id.
-- Existing installations need an explicit backfill/API migration before that change.
CREATE TABLE student_dashboard.students (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  student_number varchar(20) NOT NULL UNIQUE CHECK (student_number ~ '^[A-Za-z0-9][A-Za-z0-9-]{0,19}$'),
  user_id integer UNIQUE REFERENCES student_dashboard.users(id) ON DELETE RESTRICT,
  first_name varchar(60) NOT NULL CHECK (length(btrim(first_name)) > 0),
  last_name varchar(60) NOT NULL CHECK (length(btrim(last_name)) > 0),
  email varchar(254) NOT NULL UNIQUE,
  major_id integer REFERENCES student_dashboard.majors(id) ON DELETE RESTRICT,
  admission_term_id integer REFERENCES student_dashboard.academic_terms(id) ON DELETE RESTRICT,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT students_email_ck CHECK (
    email = lower(btrim(email)) AND email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
  )
);

-- 6. Faculty profiles, independently provisioned from accounts.
CREATE TABLE student_dashboard.faculty (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  employee_number varchar(20) NOT NULL UNIQUE CHECK (length(btrim(employee_number)) > 0),
  user_id integer UNIQUE REFERENCES student_dashboard.users(id) ON DELETE RESTRICT,
  first_name varchar(60) NOT NULL CHECK (length(btrim(first_name)) > 0),
  last_name varchar(60) NOT NULL CHECK (length(btrim(last_name)) > 0),
  email varchar(254) NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT faculty_email_ck CHECK (
    email = lower(btrim(email)) AND email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
  )
);

-- 7. Catalog courses, not individual offerings.
CREATE TABLE student_dashboard.courses (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  course_code varchar(20) NOT NULL UNIQUE CHECK (length(btrim(course_code)) > 0),
  title varchar(160) NOT NULL CHECK (length(btrim(title)) > 0),
  description text,
  default_credit_hours numeric(4,2) NOT NULL CHECK (default_credit_hours > 0 AND default_credit_hours <= 12),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 8. Named versions of grading policy, such as LETTER_4_0_V1.
CREATE TABLE student_dashboard.grading_schemes (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code varchar(40) NOT NULL UNIQUE CHECK (length(btrim(code)) > 0),
  description text NOT NULL CHECK (length(btrim(description)) > 0),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 9. Each grade code belongs to a particular grading scheme.
CREATE TABLE student_dashboard.grade_codes (
  grading_scheme_id integer NOT NULL REFERENCES student_dashboard.grading_schemes(id) ON DELETE RESTRICT,
  code varchar(3) NOT NULL CHECK (length(btrim(code)) > 0),
  grade_points numeric(3,2),
  counts_for_gpa boolean NOT NULL,
  counts_as_attempted boolean NOT NULL,
  earns_credit boolean NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (grading_scheme_id, code),
  CONSTRAINT grade_codes_points_ck CHECK (
    (counts_for_gpa AND counts_as_attempted AND grade_points IS NOT NULL AND grade_points BETWEEN 0 AND 4)
    OR (NOT counts_for_gpa AND grade_points IS NULL)
  ),
  CONSTRAINT grade_codes_earned_ck CHECK (NOT earns_credit OR counts_as_attempted)
);

-- 10. A course offered in a particular term and section.
CREATE TABLE student_dashboard.course_sections (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  course_id integer NOT NULL REFERENCES student_dashboard.courses(id) ON DELETE RESTRICT,
  term_id integer NOT NULL REFERENCES student_dashboard.academic_terms(id) ON DELETE RESTRICT,
  section_number varchar(10) NOT NULL CHECK (length(btrim(section_number)) > 0),
  instructor_id integer REFERENCES student_dashboard.faculty(id) ON DELETE RESTRICT,
  grading_scheme_id integer NOT NULL REFERENCES student_dashboard.grading_schemes(id) ON DELETE RESTRICT,
  course_code_snapshot varchar(20) NOT NULL CHECK (length(btrim(course_code_snapshot)) > 0),
  title_snapshot varchar(160) NOT NULL CHECK (length(btrim(title_snapshot)) > 0),
  credit_hours numeric(4,2) NOT NULL CHECK (credit_hours > 0 AND credit_hours <= 12),
  capacity integer NOT NULL CHECK (capacity > 0),
  delivery_mode varchar(20) NOT NULL CHECK (delivery_mode IN ('in_person', 'online', 'hybrid')),
  status varchar(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'open', 'closed', 'cancelled', 'completed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT course_sections_offering_uq UNIQUE (course_id, term_id, section_number),
  CONSTRAINT course_sections_scheme_uq UNIQUE (id, grading_scheme_id)
);

-- 11. Student registration and final course result.
CREATE TABLE student_dashboard.enrollments (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  student_id integer NOT NULL REFERENCES student_dashboard.students(id) ON DELETE RESTRICT,
  section_id integer NOT NULL,
  grading_scheme_id integer NOT NULL,
  status varchar(20) NOT NULL DEFAULT 'enrolled' CHECK (status IN ('enrolled', 'dropped', 'withdrawn', 'incomplete', 'completed')),
  enrolled_at timestamptz NOT NULL DEFAULT now(),
  withdrawn_at timestamptz,
  final_grade_code varchar(3),
  grade_posted_at timestamptz,
  grade_posted_by integer REFERENCES student_dashboard.users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT enrollments_student_section_uq UNIQUE (student_id, section_id),
  CONSTRAINT enrollments_section_uq UNIQUE (id, section_id),
  CONSTRAINT enrollments_section_scheme_fk FOREIGN KEY (section_id, grading_scheme_id)
    REFERENCES student_dashboard.course_sections(id, grading_scheme_id) ON DELETE RESTRICT,
  CONSTRAINT enrollments_final_grade_fk FOREIGN KEY (grading_scheme_id, final_grade_code)
    REFERENCES student_dashboard.grade_codes(grading_scheme_id, code) ON DELETE RESTRICT,
  CONSTRAINT enrollments_grade_metadata_ck CHECK (
    (final_grade_code IS NULL AND grade_posted_at IS NULL AND grade_posted_by IS NULL)
    OR (final_grade_code IS NOT NULL AND grade_posted_at IS NOT NULL AND grade_posted_by IS NOT NULL)
  ),
  CONSTRAINT enrollments_completed_ck CHECK (status <> 'completed' OR final_grade_code IS NOT NULL),
  CONSTRAINT enrollments_withdrawn_ck CHECK (status <> 'withdrawn' OR withdrawn_at IS NOT NULL),
  CONSTRAINT enrollments_withdrawn_time_ck CHECK (withdrawn_at IS NULL OR withdrawn_at >= enrolled_at),
  CONSTRAINT enrollments_grade_time_ck CHECK (grade_posted_at IS NULL OR grade_posted_at >= enrolled_at)
);

-- 12. Actual dated class sessions.
CREATE TABLE student_dashboard.class_meetings (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  section_id integer NOT NULL REFERENCES student_dashboard.course_sections(id) ON DELETE RESTRICT,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  location varchar(160) CHECK (location IS NULL OR length(btrim(location)) > 0),
  meeting_url text CHECK (meeting_url IS NULL OR length(btrim(meeting_url)) > 0),
  status varchar(20) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'held', 'cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT class_meetings_times_ck CHECK (ends_at > starts_at),
  CONSTRAINT class_meetings_start_uq UNIQUE (section_id, starts_at),
  CONSTRAINT class_meetings_section_uq UNIQUE (id, section_id)
);

-- 13. Same-section FKs prevent marking attendance for a different class.
CREATE TABLE student_dashboard.attendance_records (
  meeting_id integer NOT NULL,
  enrollment_id integer NOT NULL,
  section_id integer NOT NULL,
  status varchar(20) NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
  recorded_by integer NOT NULL REFERENCES student_dashboard.users(id) ON DELETE RESTRICT,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  note text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (meeting_id, enrollment_id),
  CONSTRAINT attendance_meeting_fk FOREIGN KEY (meeting_id, section_id)
    REFERENCES student_dashboard.class_meetings(id, section_id) ON DELETE RESTRICT,
  CONSTRAINT attendance_enrollment_fk FOREIGN KEY (enrollment_id, section_id)
    REFERENCES student_dashboard.enrollments(id, section_id) ON DELETE RESTRICT
);

-- 14. Assignments belong to an offered section.
CREATE TABLE student_dashboard.assignments (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  section_id integer NOT NULL REFERENCES student_dashboard.course_sections(id) ON DELETE RESTRICT,
  title varchar(160) NOT NULL CHECK (length(btrim(title)) > 0),
  instructions text,
  due_at timestamptz NOT NULL,
  max_points numeric(8,2) NOT NULL CHECK (max_points > 0 AND max_points <= 999999.99),
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT assignments_section_uq UNIQUE (id, section_id)
);

-- 15. One current submission/grade per assignment and enrolled student.
CREATE TABLE student_dashboard.submissions (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  assignment_id integer NOT NULL,
  enrollment_id integer NOT NULL,
  section_id integer NOT NULL,
  submitted_at timestamptz,
  submission_text text CHECK (submission_text IS NULL OR length(btrim(submission_text)) > 0),
  attachment_key text CHECK (attachment_key IS NULL OR length(btrim(attachment_key)) > 0),
  points_awarded numeric(8,2),
  feedback text,
  graded_by integer REFERENCES student_dashboard.users(id) ON DELETE RESTRICT,
  graded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT submissions_assignment_enrollment_uq UNIQUE (assignment_id, enrollment_id),
  CONSTRAINT submissions_assignment_fk FOREIGN KEY (assignment_id, section_id)
    REFERENCES student_dashboard.assignments(id, section_id) ON DELETE RESTRICT,
  CONSTRAINT submissions_enrollment_fk FOREIGN KEY (enrollment_id, section_id)
    REFERENCES student_dashboard.enrollments(id, section_id) ON DELETE RESTRICT,
  CONSTRAINT submissions_content_ck CHECK (
    submitted_at IS NULL OR submission_text IS NOT NULL OR attachment_key IS NOT NULL
  ),
  CONSTRAINT submissions_grade_ck CHECK (
    (points_awarded IS NULL AND graded_by IS NULL AND graded_at IS NULL)
    OR (points_awarded IS NOT NULL AND points_awarded BETWEEN 0 AND 999999.99
        AND graded_by IS NOT NULL AND graded_at IS NOT NULL)
  )
);

-- 16. Shared notices; a null author represents a system event.
CREATE TABLE student_dashboard.notifications (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_by integer REFERENCES student_dashboard.users(id) ON DELETE RESTRICT,
  section_id integer REFERENCES student_dashboard.course_sections(id) ON DELETE RESTRICT,
  title varchar(160) NOT NULL CHECK (length(btrim(title)) > 0),
  body text NOT NULL CHECK (length(btrim(body)) > 0),
  severity varchar(20) NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'urgent')),
  published_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT notifications_expiry_ck CHECK (expires_at IS NULL OR expires_at > published_at)
);

-- 17. Read/dismissed state belongs to the recipient, not the notice.
CREATE TABLE student_dashboard.notification_recipients (
  notification_id integer NOT NULL REFERENCES student_dashboard.notifications(id) ON DELETE CASCADE,
  user_id integer NOT NULL REFERENCES student_dashboard.users(id) ON DELETE RESTRICT,
  delivered_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz,
  dismissed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (notification_id, user_id),
  CONSTRAINT recipients_read_time_ck CHECK (read_at IS NULL OR read_at >= delivered_at),
  CONSTRAINT recipients_dismissed_time_ck CHECK (dismissed_at IS NULL OR dismissed_at >= delivered_at)
);

-- 18. Entity IDs refer to the entity_type named by the writing service.
-- This is intentionally not a polymorphic foreign key.
CREATE TABLE student_dashboard.audit_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  actor_user_id integer REFERENCES student_dashboard.users(id) ON DELETE RESTRICT,
  entity_type varchar(40) NOT NULL CHECK (length(btrim(entity_type)) > 0),
  entity_id integer NOT NULL CHECK (entity_id > 0),
  action varchar(30) NOT NULL CHECK (length(btrim(action)) > 0),
  occurred_at timestamptz NOT NULL DEFAULT now(),
  change_summary jsonb NOT NULL CHECK (jsonb_typeof(change_summary) = 'object')
);

-- Index the referencing side of FKs when a PK/UQ does not already cover it.
CREATE INDEX students_major_id_idx ON student_dashboard.students(major_id);
CREATE INDEX students_admission_term_idx ON student_dashboard.students(admission_term_id);
CREATE INDEX sections_term_idx ON student_dashboard.course_sections(term_id);
CREATE INDEX sections_instructor_term_idx ON student_dashboard.course_sections(instructor_id, term_id);
CREATE INDEX sections_grading_scheme_idx ON student_dashboard.course_sections(grading_scheme_id);
CREATE INDEX enrollments_section_status_idx ON student_dashboard.enrollments(section_id, status);
CREATE INDEX enrollments_grade_idx ON student_dashboard.enrollments(grading_scheme_id, final_grade_code);
CREATE INDEX enrollments_grade_poster_idx ON student_dashboard.enrollments(grade_posted_by);
CREATE INDEX attendance_enrollment_idx ON student_dashboard.attendance_records(enrollment_id, section_id);
CREATE INDEX attendance_recorder_idx ON student_dashboard.attendance_records(recorded_by);
CREATE INDEX assignments_section_due_idx ON student_dashboard.assignments(section_id, due_at);
CREATE INDEX submissions_enrollment_idx ON student_dashboard.submissions(enrollment_id, section_id);
CREATE INDEX submissions_grader_idx ON student_dashboard.submissions(graded_by);
CREATE INDEX notifications_author_idx ON student_dashboard.notifications(created_by);
CREATE INDEX notifications_section_idx ON student_dashboard.notifications(section_id);
CREATE INDEX recipients_inbox_idx ON student_dashboard.notification_recipients(user_id, delivered_at DESC);
CREATE INDEX recipients_unread_idx ON student_dashboard.notification_recipients(user_id, delivered_at DESC) WHERE read_at IS NULL;
CREATE INDEX audit_actor_idx ON student_dashboard.audit_events(actor_user_id);
CREATE INDEX audit_entity_idx ON student_dashboard.audit_events(entity_type, entity_id, occurred_at DESC);

-- Keep updated_at accurate for SQL edits as well as Express requests.
CREATE FUNCTION student_dashboard.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := clock_timestamp();
  RETURN NEW;
END;
$$;

-- The table names are a fixed internal list, never user input.
DO $$
DECLARE
  table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'users', 'majors', 'academic_terms', 'students', 'faculty', 'courses',
    'grading_schemes', 'grade_codes', 'course_sections', 'enrollments',
    'class_meetings', 'attendance_records', 'assignments', 'submissions',
    'notifications', 'notification_recipients'
  ] LOOP
    EXECUTE format('CREATE TRIGGER set_updated_at BEFORE UPDATE ON student_dashboard.%I
      FOR EACH ROW EXECUTE FUNCTION student_dashboard.set_updated_at()', table_name);
  END LOOP;
END;
$$;

-- Protect audit rows from ordinary UPDATE, DELETE, and TRUNCATE operations.
-- Schema owners can change triggers; production roles/privileges are separate work.
CREATE FUNCTION student_dashboard.reject_audit_change()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'Audit events are append-only.' USING ERRCODE = '55000';
END;
$$;

CREATE TRIGGER audit_events_append_only
BEFORE UPDATE OR DELETE OR TRUNCATE ON student_dashboard.audit_events
FOR EACH STATEMENT EXECUTE FUNCTION student_dashboard.reject_audit_change();

COMMIT;

-- Still requires application transactions/authorization or additional triggers:
-- section capacity; eligibility; grading-scheme immutability once used;
-- freezing section snapshots; points <= assignment max_points; schedule conflicts;
-- official GPA/repeat/withdrawal policy; actor permissions; audit event creation.
