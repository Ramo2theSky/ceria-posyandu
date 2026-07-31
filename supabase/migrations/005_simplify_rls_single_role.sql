-- CERIA - Simplify RLS (single role)
-- Version: 4.0
-- Description: Remove admin role checks, all authenticated users have full access.

-- ============================================================
-- RLS: simplified policies (single role - all staff are equal)
-- ============================================================
DROP POLICY IF EXISTS "kader_input" ON public.pemeriksaan;
CREATE POLICY "authenticated_insert" ON public.pemeriksaan
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated'
    );

DROP POLICY IF EXISTS "kader_edit_milik_sendiri" ON public.pemeriksaan;
DROP POLICY IF EXISTS "admin_edit_semua" ON public.pemeriksaan;
DROP POLICY IF EXISTS "kader_soft_delete" ON public.pemeriksaan;
CREATE POLICY "authenticated_update" ON public.pemeriksaan
    FOR UPDATE USING (
        auth.role() = 'authenticated'
    )
    WITH CHECK (
        auth.role() = 'authenticated'
    );

DROP POLICY IF EXISTS "admin_hard_delete" ON public.pemeriksaan;
CREATE POLICY "authenticated_delete" ON public.pemeriksaan
    FOR DELETE USING (
        auth.role() = 'authenticated'
    );

-- Keep the trigger for dibuat_oleh
-- (already exists from 003 migration)
