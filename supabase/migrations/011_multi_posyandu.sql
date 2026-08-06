-- Migration 011: Multi-Posyandu Support
-- Menambahkan tabel posyandu dan kolom posyandu_id untuk mendukung 5 posyandu berbeda

-- 1. Buat tabel posyandu
CREATE TABLE posyandu (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Insert 5 posyandu
INSERT INTO posyandu (nama) VALUES
  ('Posyandu Dk. Krajan (Mawar 1)'),
  ('Posyandu Dk. Daleman (Mawar 2)'),
  ('Posyandu Dk. Jurangjero (Mawar 3)'),
  ('Posyandu Dk. Ngawinan (Mawar 4)'),
  ('Posyandu Dk. Bungkusan (Mawar 5)');

-- 3. Tambah kolom posyandu_id ke pemeriksaan
ALTER TABLE pemeriksaan 
  ADD COLUMN posyandu_id UUID REFERENCES posyandu(id);

-- 4. Enable RLS pada tabel posyandu
ALTER TABLE posyandu ENABLE ROW LEVEL SECURITY;

-- Semua authenticated user bisa baca daftar posyandu
CREATE POLICY "authenticated_read_posyandu" ON posyandu
  FOR SELECT USING (auth.role() = 'authenticated');

-- 5. Update RLS policies pada pemeriksaan
-- Drop existing policies
DROP POLICY IF EXISTS "kader_baca" ON pemeriksaan;
DROP POLICY IF EXISTS "authenticated_insert" ON pemeriksaan;
DROP POLICY IF EXISTS "authenticated_update" ON pemeriksaan;
DROP POLICY IF EXISTS "authenticated_delete" ON pemeriksaan;

-- Super admin: bisa melakukan semua operasi pada semua data
CREATE POLICY "super_admin_all" ON pemeriksaan
  FOR ALL USING (
    (auth.jwt()->'user_metadata'->>'is_super_admin')::boolean = true
  );

-- Kader: hanya bisa SELECT data posyandu sendiri
CREATE POLICY "kader_select" ON pemeriksaan
  FOR SELECT USING (
    posyandu_id = (
      SELECT (auth.jwt()->'user_metadata'->>'posyandu_id')::uuid
    )
  );

-- Kader: hanya bisa INSERT data ke posyandu sendiri
CREATE POLICY "kader_insert" ON pemeriksaan
  FOR INSERT WITH CHECK (
    posyandu_id = (
      SELECT (auth.jwt()->'user_metadata'->>'posyandu_id')::uuid
    )
  );

-- Kader: hanya bisa UPDATE data posyandu sendiri
CREATE POLICY "kader_update" ON pemeriksaan
  FOR UPDATE USING (
    posyandu_id = (
      SELECT (auth.jwt()->'user_metadata'->>'posyandu_id')::uuid
    )
  );

-- Kader: hanya bisa DELETE data posyandu sendiri
CREATE POLICY "kader_delete" ON pemeriksaan
  FOR DELETE USING (
    posyandu_id = (
      SELECT (auth.jwt()->'user_metadata'->>'posyandu_id')::uuid
    )
  );

-- 6. Buat view untuk memudahkan query dengan nama posyandu
CREATE OR REPLACE VIEW v_pemeriksaan_dengan_posyandu AS
SELECT 
  p.*,
  pos.nama as posyandu_nama
FROM pemeriksaan p
LEFT JOIN posyandu pos ON p.posyandu_id = pos.id
WHERE p.dihapus_pada IS NULL;

-- 7. Grant access
GRANT SELECT ON v_pemeriksaan_dengan_posyandu TO authenticated;
GRANT SELECT ON posyandu TO authenticated;
