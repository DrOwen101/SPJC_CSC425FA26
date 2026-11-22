CREATE TABLE IF NOT EXISTS faculty_advising_notes (
    note_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    student_id INTEGER NOT NULL,
    note_text TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_advising_student
        FOREIGN KEY (student_id)
        REFERENCES students(student_id)
        ON DELETE CASCADE,

    CONSTRAINT advising_note_not_blank
        CHECK (length(trim(note_text)) > 0)
);

CREATE INDEX IF NOT EXISTS idx_advising_notes_student
ON faculty_advising_notes(student_id);