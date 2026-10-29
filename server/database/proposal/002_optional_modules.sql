-- OPTIONAL: apply after 001_application_schema.sql in the same fresh review DB.
-- These tables support the remaining faculty schedule/material placeholders.
BEGIN;

-- 19. A published course resource, stored as an external URL or storage key.
CREATE TABLE student_dashboard.course_materials (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  section_id integer NOT NULL REFERENCES student_dashboard.course_sections(id) ON DELETE RESTRICT,
  title varchar(160) NOT NULL CHECK (length(btrim(title)) > 0),
  resource_url text CHECK (resource_url IS NULL OR length(btrim(resource_url)) > 0),
  storage_key text CHECK (storage_key IS NULL OR length(btrim(storage_key)) > 0),
  created_by integer NOT NULL REFERENCES student_dashboard.users(id) ON DELETE RESTRICT,
  published_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT course_materials_resource_ck CHECK (resource_url IS NOT NULL OR storage_key IS NOT NULL)
);

-- 20. Actual dated faculty availability, rather than a recurrence expression.
CREATE TABLE student_dashboard.office_hours (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  faculty_id integer NOT NULL REFERENCES student_dashboard.faculty(id) ON DELETE RESTRICT,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  location varchar(160) CHECK (location IS NULL OR length(btrim(location)) > 0),
  meeting_url text CHECK (meeting_url IS NULL OR length(btrim(meeting_url)) > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT office_hours_times_ck CHECK (ends_at > starts_at),
  CONSTRAINT office_hours_location_ck CHECK (location IS NOT NULL OR meeting_url IS NOT NULL),
  CONSTRAINT office_hours_start_uq UNIQUE (faculty_id, starts_at)
);

-- 21. A student's booking within an office-hours interval.
CREATE TABLE student_dashboard.appointments (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  office_hours_id integer NOT NULL REFERENCES student_dashboard.office_hours(id) ON DELETE RESTRICT,
  student_id integer NOT NULL REFERENCES student_dashboard.students(id) ON DELETE RESTRICT,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  status varchar(20) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT appointments_times_ck CHECK (ends_at > starts_at)
);

CREATE INDEX materials_section_idx ON student_dashboard.course_materials(section_id);
CREATE INDEX materials_creator_idx ON student_dashboard.course_materials(created_by);
CREATE INDEX appointments_office_hours_idx ON student_dashboard.appointments(office_hours_id, starts_at);
CREATE INDEX appointments_student_idx ON student_dashboard.appointments(student_id, starts_at);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON student_dashboard.course_materials
FOR EACH ROW EXECUTE FUNCTION student_dashboard.set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON student_dashboard.office_hours
FOR EACH ROW EXECUTE FUNCTION student_dashboard.set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON student_dashboard.appointments
FOR EACH ROW EXECUTE FUNCTION student_dashboard.set_updated_at();

COMMIT;

-- Not enforced by these table-local checks: appointments contained in the parent
-- office-hours interval, overlapping availability/bookings, or authorized booking.
-- Implement those checks transactionally before exposing appointment endpoints.
