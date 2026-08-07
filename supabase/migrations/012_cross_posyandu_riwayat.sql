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
      WHERE id = (auth.jwt()->'user_metadata'->>'posyandu_id')::uuid
    )
  );

-- 2. Kader_delete: tetap hanya bisa hapus data posyandu sendiri
--    (sudah benar dari migration 011, tidak perlu diubah)

