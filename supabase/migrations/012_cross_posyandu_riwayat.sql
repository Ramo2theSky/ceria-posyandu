-- Migration 012: Cross-Posyandu Riwayat + Fix Kader Update/Delete
-- 1. Ubah policy kader_select:
--    - Semua data aktif (dihapus_pada IS NULL) dari semua posyandu
--    - Data terhapus (dihapus_pada IS NOT NULL) hanya dari posyandu sendiri (untuk recycle bin)
DROP POLICY IF EXISTS "kader_select" ON pemeriksaan;

CREATE POLICY "kader_select" ON pemeriksaan
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM posyandu
      WHERE id = (auth.jwt()->'user_metadata'->>'posyandu_id')::uuid
    )
    AND (
      dihapus_pada IS NULL
      OR posyandu_id = (auth.jwt()->'user_metadata'->>'posyandu_id')::uuid
    )
  );

-- 2. Pastikan kader_update: hanya bisa UPDATE data posyandu sendiri
DROP POLICY IF EXISTS "kader_update" ON pemeriksaan;
DROP POLICY IF EXISTS "authenticated_update" ON pemeriksaan;

CREATE POLICY "kader_update" ON pemeriksaan
  FOR UPDATE USING (
    posyandu_id = (
      SELECT (auth.jwt()->'user_metadata'->>'posyandu_id')::uuid
    )
  );

-- 3. Pastikan kader_delete: hanya bisa DELETE data posyandu sendiri
DROP POLICY IF EXISTS "kader_delete" ON pemeriksaan;
DROP POLICY IF EXISTS "authenticated_delete" ON pemeriksaan;

CREATE POLICY "kader_delete" ON pemeriksaan
  FOR DELETE USING (
    posyandu_id = (
      SELECT (auth.jwt()->'user_metadata'->>'posyandu_id')::uuid
    )
  );

-- 4. Pastikan kader_insert: hanya bisa INSERT data ke posyandu sendiri
DROP POLICY IF EXISTS "kader_insert" ON pemeriksaan;
DROP POLICY IF EXISTS "authenticated_insert" ON pemeriksaan;

CREATE POLICY "kader_insert" ON pemeriksaan
  FOR INSERT WITH CHECK (
    posyandu_id = (
      SELECT (auth.jwt()->'user_metadata'->>'posyandu_id')::uuid
    )
  );

