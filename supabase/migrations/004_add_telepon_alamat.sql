-- CERIA - Add phone & address columns
-- Version: 1.0
-- Description: Add no_telepon and alamat to pemeriksaan

ALTER TABLE pemeriksaan
    ADD COLUMN IF NOT EXISTS no_telepon VARCHAR(20),
    ADD COLUMN IF NOT EXISTS alamat TEXT;
