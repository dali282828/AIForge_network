-- SQL script to fix database encoding
-- Run this in pgAdmin or psql

-- Step 1: Disconnect all connections to the database
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = 'aiforge' AND pid <> pg_backend_pid();

-- Step 2: Drop and recreate database with UTF-8 encoding
DROP DATABASE IF EXISTS aiforge;

CREATE DATABASE aiforge
    WITH OWNER = aiforge
    ENCODING = 'UTF8'
    LC_COLLATE = 'en_US.UTF-8'
    LC_CTYPE = 'en_US.UTF-8'
    TEMPLATE = template0;

-- Step 3: Grant privileges
GRANT ALL PRIVILEGES ON DATABASE aiforge TO aiforge;

-- Step 4: Connect to the new database and verify encoding
\c aiforge
SHOW server_encoding;
SELECT datname, encoding, datcollate, datctype 
FROM pg_database 
WHERE datname = 'aiforge';

