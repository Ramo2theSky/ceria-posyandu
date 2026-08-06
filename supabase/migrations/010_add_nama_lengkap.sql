-- Migration 010: Menambahkan kolom nama_lengkap ke tabel pemeriksaan
-- Digunakan untuk identifikasi warga berdasarkan nama selain NIK

ALTER TABLE pemeriksaan ADD COLUMN nama_lengkap VARCHAR(100);

COMMENT ON COLUMN pemeriksaan.nama_lengkap IS 'Nama lengkap warga untuk identifikasi dan pencarian';
