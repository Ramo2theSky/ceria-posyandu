-- CERIA - Add jenis_gula_darah column
-- Version: 1.0
-- Description: Split GDS into GDP (puasa) and GDS (sewaktu) classification

-- ============================================================
-- ALTER TABLE: tambah kolom jenis_gula_darah
-- ============================================================
ALTER TABLE pemeriksaan
ADD COLUMN IF NOT EXISTS jenis_gula_darah VARCHAR(10) NOT NULL DEFAULT 'sewaktu'
CHECK (jenis_gula_darah IN ('puasa', 'sewaktu'));

-- ============================================================
-- BACKFILL: data lama dianggap 'sewaktu' (sudah default)
-- ============================================================
UPDATE pemeriksaan SET jenis_gula_darah = 'sewaktu' WHERE jenis_gula_darah IS NULL;

-- ============================================================
-- UPDATE VIEW: v_pemeriksaan_aktif
-- ============================================================
CREATE OR REPLACE VIEW v_pemeriksaan_aktif AS
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
    jenis_gula_darah,
    kolesterol_total,
    tanggal_periksa,
    catatan,
    dibuat_oleh,
    dibuat_pada,
    diubah_pada,
    -- Computed fields
    FLOOR(EXTRACT(YEAR FROM AGE(tanggal_periksa, tanggal_lahir)))::SMALLINT AS usia,
    ROUND((berat_badan / POWER(tinggi_badan / 100.0, 2))::NUMERIC, 1) AS imt
FROM pemeriksaan
WHERE dihapus_pada IS NULL;

-- ============================================================
-- UPDATE VIEW: v_pemeriksaan_recycle_bin
-- ============================================================
CREATE OR REPLACE VIEW v_pemeriksaan_recycle_bin AS
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
    jenis_gula_darah,
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
