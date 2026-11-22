CREATE SCHEMA IF NOT EXISTS alerts_db;

CREATE TABLE IF NOT EXISTS alerts_db.alerts (
    id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    subject varchar(100) NOT NULL CHECK (length(btrim(subject)) > 0),
    message varchar(255) NOT NULL CHECK (length(btrim(message)) > 0),
    created_at timestamptz NOT NULL DEFAULT NOW(),
    is_read boolean NOT NULL DEFAULT FALSE
);

INSERT INTO alerts_db.alerts (subject, message) VALUES
('Alerts System Test', 'This is a test alert to verify the alerts system is functioning correctly.'),
('Second Test Alert', 'This is another test alert to ensure the alerts system is working as expected.'),
('Third Test Alert', 'This is a third test alert to confirm the alerts system is operational.');

-- to create table use the following command in your terminal:
-- psql -U postgres -d csc425fa26 -f .\server\Database\alerts.sql