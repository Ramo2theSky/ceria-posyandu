-- CERIA - Harden RLS for pemeriksaan
-- Version: 3.0
-- Description: Prevent client-controlled ownership changes on INSERT/UPDATE,
--              enforce server-side dibuat_oleh assignment, and add admin
--              UPDATE/DELETE overrides via custom claim `user_role`.

-- ============================================================
-- RLS: tighten INSERT/UPDATE policies on pemeriksaan
-- ============================================================
DROP POLICY IF EXISTS "kader_input" ON public.pemeriksaan;
CREATE POLICY "kader_input" ON public.pemeriksaan
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated'
        AND dibuat_oleh = auth.uid()
    );

DROP POLICY IF EXISTS "kader_edit_milik_sendiri" ON public.pemeriksaan;
CREATE POLICY "kader_edit_milik_sendiri" ON public.pemeriksaan
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

DROP POLICY IF EXISTS "kader_soft_delete" ON public.pemeriksaan;
CREATE POLICY "kader_soft_delete" ON public.pemeriksaan
    FOR UPDATE USING (
        auth.role() = 'authenticated'
        AND (
            (auth.jwt() ->> 'user_role') = 'admin'
            OR dibuat_oleh = auth.uid()
        )
        AND dihapus_pada IS NULL
    )
    WITH CHECK (
        auth.role() = 'authenticated'
        AND dihapus_pada IS NOT NULL
        AND (
            (auth.jwt() ->> 'user_role') = 'admin'
            OR dibuat_oleh = auth.uid()
        )
    );

DROP POLICY IF EXISTS "admin_edit_semua" ON public.pemeriksaan;
CREATE POLICY "admin_edit_semua" ON public.pemeriksaan
    FOR UPDATE USING (
        auth.role() = 'authenticated'
        AND (auth.jwt() ->> 'user_role') = 'admin'
    )
    WITH CHECK (
        auth.role() = 'authenticated'
        AND (auth.jwt() ->> 'user_role') = 'admin'
    );

DROP POLICY IF EXISTS "admin_hard_delete" ON public.pemeriksaan;
CREATE POLICY "admin_hard_delete" ON public.pemeriksaan
    FOR DELETE USING (
        auth.role() = 'authenticated'
        AND (auth.jwt() ->> 'user_role') = 'admin'
    );

-- ============================================================
-- TRIGGER: force dibuat_oleh on INSERT
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_pemeriksaan_dibuat_oleh()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.dibuat_oleh := auth.uid();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_set_pemeriksaan_dibuat_oleh ON public.pemeriksaan;
CREATE TRIGGER trigger_set_pemeriksaan_dibuat_oleh
    BEFORE INSERT ON public.pemeriksaan
    FOR EACH ROW
    EXECUTE FUNCTION public.set_pemeriksaan_dibuat_oleh();