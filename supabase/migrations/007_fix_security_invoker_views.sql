-- CERIA - Fix Security Definer View
-- Version: 7.0
-- Description: Recreate views with SECURITY INVOKER to enforce RLS

DROP VIEW IF EXISTS v_pemeriksaan_aktif;
CREATE VIEW v_pemeriksaan_aktif
WITH (security_invoker = true) AS
SELECT
    id,
    nik,
    tanggal_lahir,
    jenis_kelamin,
    berat_badan,
    tinggi_badan,
    lingkar_pinggang,
    td_sistol,
    td_diastol,
    gds,
    kolesterol_total,
    tanggal_periksa,
    catatan,
    dibuat_oleh,
    dibuat_pada,
    diubah_pada,
    FLOOR(EXTRACT(YEAR FROM AGE(tanggal_periksa, tanggal_lahir)))::SMALLINT AS usia,
    ROUND((berat_badan / POWER(tinggi_badan / 100.0, 2))::NUMERIC, 1) AS imt
FROM pemeriksaan
WHERE dihapus_pada IS NULL;

DROP VIEW IF EXISTS v_pemeriksaan_recycle_bin;
CREATE VIEW v_pemeriksaan_recycle_bin
WITH (security_invoker = true) AS
SELECT
    id,
    nik,
    tanggal_lahir,
    jenis_kelamin,
    berat_badan,
    tinggi_badan,
    lingkar_pinggang,
    td_sistol,
    td_diastol,
    gds,
    kolesterol_total,
    tanggal_periksa,
    catatan,
    dibuat_oleh,
    dibuat_pada,
    diubah_pada,
    dihapus_pada,
    dihapus_oleh,
    FLOOR(EXTRACT(YEAR FROM AGE(tanggal_periksa, tanggal_lahir)))::SMALLINT AS usia,
    ROUND((berat_badan / POWER(tinggi_badan / 100.0, 2))::NUMERIC, 1) AS imt
FROM pemeriksaan
WHERE dihapus_pada IS NOT NULL
ORDER BY dihapus_pada DESC;
