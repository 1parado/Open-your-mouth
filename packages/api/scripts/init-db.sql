-- Initialize database for AI Oral Teacher API Service
-- Run this script as superuser (e.g., postgre)

-- Create database if not exists
SELECT 'CREATE DATABASE oral_teacher'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'oral_teacher');