-- CERIA - Initial Schema
-- Version: 1.0
-- Description: Core tables, RLS policies, indexes

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- TABLE: pemeriksaan (main data table)
-- ============================================================
CREATE TABLE IF NOT EXISTS pemeriksaan (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Identitas warga
    nik                 VARCHAR(16) NOT NULL,
    tanggal_lahir       DATE NOT NULL,
    jenis_kelamin       CHAR(1) NOT NULL CHECK (jenis_kelamin IN ('L', 'P')),

    -- Hasil pengukuran
    berat_badan         NUMERIC(5,1) NOT NULL,
    tinggi_badan        NUMERIC(5,1) NOT NULL,
    lingkar_pinggang    NUMERIC(5,1) NOT NULL,
    td_sistol           SMALLINT NOT NULL,
    td_diastol          SMALLINT NOT NULL,
    gds                 SMALLINT NOT NULL,
    kolesterol_total    SMALLINT,  -- nullable: tidak semua warga dicek

    -- Metadata sesi
    tanggal_periksa     DATE NOT NULL DEFAULT CURRENT_DATE,
    catatan             TEXT,

    -- Audit
    dibuat_oleh         UUID REFERENCES auth.users(id),
    dibuat_pada         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    diubah_pada         TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Soft delete
    dihapus_pada        TIMESTAMPTZ,
    dihapus_oleh        UUID REFERENCES auth.users(id)
);

-- ============================================================
-- INDEXES
-- ============================================================
-- Primary lookup: by NIK + tanggal_periksa (most common query)
CREATE INDEX IF NOT EXISTS idx_pemeriksaan_nik_tanggal
    ON pemeriksaan (nik, tanggal_periksa DESC)
    WHERE dihapus_pada IS NULL;

-- Search by NIK only
CREATE INDEX IF NOT EXISTS idx_pemeriksaan_nik
    ON pemeriksaan (nik)
    WHERE dihapus_pada IS NULL;

-- Search by tanggal_periksa (for rekap harian)
CREATE INDEX IF NOT EXISTS idx_pemeriksaan_tanggal
    ON pemeriksaan (tanggal_periksa DESC)
    WHERE dihapus_pada IS NULL;

-- Admin queries: all including deleted
CREATE INDEX IF NOT EXISTS idx_pemeriksaan_all_nik
    ON pemeriksaan (nik);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE pemeriksaan ENABLE ROW LEVEL SECURITY;

-- Policy 1: Authenticated users can read all non-deleted records
CREATE POLICY "kader_baca" ON pemeriksaan
    FOR SELECT USING (
        auth.role() = 'authenticated'
        AND dihapus_pada IS NULL
    );

-- Policy 2: Authenticated users can insert new records
CREATE POLICY "kader_input" ON pemeriksaan
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated'
        AND dibuat_oleh = auth.uid()
    );

-- Policy 3: Users can only update their own records (non-deleted)
CREATE POLICY "kader_edit_milik_sendiri" ON pemeriksaan
    FOR UPDATE USING (
        auth.role() = 'authenticated'
        AND dibuat_oleh = auth.uid()
        AND dihapus_pada IS NULL
    )
    WITH CHECK (
        auth.role() = 'authenticated'
        AND dibuat_oleh = auth.uid()
        AND dihapus_pada IS NULL
    );

-- Policy 4: Soft delete - only admin can mark as deleted
CREATE POLICY "kader_soft_delete" ON pemeriksaan
    FOR UPDATE USING (
        auth.role() = 'authenticated'
        AND (
            (auth.jwt() ->> 'role') = 'admin'
            OR dibuat_oleh = auth.uid()
        )
        AND dihapus_pada IS NULL
    )
    WITH CHECK (
        auth.role() = 'authenticated'
        AND dihapus_pada IS NOT NULL
    );

-- Policy 5: Hard delete - ONLY admin (via custom claim)
CREATE POLICY "admin_hard_delete" ON pemeriksaan
    FOR DELETE USING (
        auth.role() = 'authenticated'
        AND (auth.jwt() ->> 'role') = 'admin'
    );

-- Policy 6: Admin can read ALL records (including deleted)
CREATE POLICY "admin_baca_semua" ON pemeriksaan
    FOR SELECT USING (
        auth.role() = 'authenticated'
        AND (auth.jwt() ->> 'role') = 'admin'
    );

-- ============================================================
-- TRIGGER: auto-update diubah_pada
-- ============================================================
CREATE OR REPLACE FUNCTION update_diubah_pada()
RETURNS TRIGGER AS $$
BEGIN
    NEW.diubah_pada = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_diubah_pada ON pemeriksaan;
CREATE TRIGGER trigger_update_diubah_pada
    BEFORE UPDATE ON pemeriksaan
    FOR EACH ROW
    EXECUTE FUNCTION update_diubah_pada();

-- ============================================================
-- HELPER VIEW: v_pemeriksaan_aktif (non-deleted only)
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
-- HELPER VIEW: v_pemeriksaan_recycle_bin (deleted only)
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