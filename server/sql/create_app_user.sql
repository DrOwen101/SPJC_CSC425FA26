-- OPTIONAL: run as a PostgreSQL administrator after creating the database.
-- Replace the placeholder password BEFORE running this script.
-- If dashboard_app already exists, skip CREATE ROLE and run the GRANT statements.
-- Do not commit a copy containing a real password.

CREATE ROLE dashboard_app LOGIN PASSWORD 'REPLACE_WITH_YOUR_LOCAL_PASSWORD';
GRANT CONNECT ON DATABASE studentdashboard TO dashboard_app;
GRANT USAGE ON SCHEMA public TO dashboard_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO dashboard_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO dashboard_app;
