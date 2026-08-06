-- Migration 012: Cross-Posyandu Riwayat
-- Mengubah RLS kader_select agar kader bisa melihat riwayat lintas posyandu
-- (semua data aktif, bukan hanya posyandu sendiri)

-- 1. Ubah policy kader_select: kader bisa baca semua data aktif
DROP POLICY IF EXISTS "kader_select" ON pemeriksaan;

CREATE POLICY "kader_select" ON pemeriksaan
  FOR SELECT USING (
    dihapus_pada IS NULL
    AND EXISTS (
      SELECT 1 FROM posyandu
      WHERE id = (auth.jwt() ->> 'posyandu_id')::uuid
    )
  );

-- 2. Ubah policy kader_delete: kader bisa soft-delete data dari posyandu mana saja
--    (karena riwayat bisa dari posyandu lain, kader perlu bisa hapus data yang dilihat)
DROP POLICY IF EXISTS "kader_delete" ON pemeriksaan;

CREATE POLICY "kader_delete" ON pemeriksaan
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM posyandu
      WHERE id = (auth.jwt() ->> 'posyandu_id')::uuid
    )
  );
