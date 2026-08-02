-- CERIA - Fix Recycle Bin Restore RLS
-- Version: 9.0
-- Description: Ensure restore (UPDATE dihapus_pada = NULL) works for all authenticated users.
--              Migration 003's kader_soft_delete had WITH CHECK (dihapus_pada IS NOT NULL)
--              which blocks restore. Migration 005 tried to drop it but may not have
--              applied cleanly on all environments.

-- Drop all existing UPDATE policies and recreate a single clean one
DROP POLICY IF EXISTS "kader_input" ON public.pemeriksaan;
DROP POLICY IF EXISTS "kader_edit_milik_sendiri" ON public.pemeriksaan;
DROP POLICY IF EXISTS "kader_soft_delete" ON public.pemeriksaan;
DROP POLICY IF EXISTS "admin_edit_semua" ON public.pemeriksaan;
DROP POLICY IF EXISTS "authenticated_update" ON public.pemeriksaan;

CREATE POLICY "authenticated_update" ON public.pemeriksaan
    FOR UPDATE USING (
        auth.role() = 'authenticated'
    )
    WITH CHECK (
        auth.role() = 'authenticated'
    );

-- Drop all existing DELETE policies and recreate
DROP POLICY IF EXISTS "admin_hard_delete" ON public.pemeriksaan;
DROP POLICY IF EXISTS "authenticated_delete" ON public.pemeriksaan;

CREATE POLICY "authenticated_delete" ON public.pemeriksaan
    FOR DELETE USING (
        auth.role() = 'authenticated'
    );

-- Drop all existing INSERT policies and recreate
DROP POLICY IF EXISTS "kader_input" ON public.pemeriksaan;
DROP POLICY IF EXISTS "authenticated_insert" ON public.pemeriksaan;

CREATE POLICY "authenticated_insert" ON public.pemeriksaan
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated'
    );
