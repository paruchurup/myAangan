-- Run once on fresh DB volume (docker-entrypoint-initdb.d)
-- Widens role/status columns to accommodate all new role names
-- Safe to run even if columns are already wide enough

ALTER TABLE users
  MODIFY COLUMN role    VARCHAR(50)  NOT NULL,
  MODIFY COLUMN status  VARCHAR(30)  NOT NULL;
