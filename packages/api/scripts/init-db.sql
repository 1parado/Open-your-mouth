-- Initialize database for AI Oral Teacher API Service.
-- Run with psql as a database user that can create databases.
-- Example:
--   psql -U postgres -d postgres -f packages/api/scripts/init-db.sql

SELECT 'CREATE DATABASE oral_teacher'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'oral_teacher')
\gexec
