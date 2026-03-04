-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS myaangandb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create user if it doesn't exist (optional, root will work)
-- CREATE USER IF NOT EXISTS 'myaangan'@'localhost' IDENTIFIED BY 'password';
-- GRANT ALL PRIVILEGES ON myaangandb.* TO 'myaangan'@'localhost';
-- FLUSH PRIVILEGES;

-- Use the database
USE myaangandb;

-- Display current state
SELECT 'Database myaangandb created/verified' AS status;

