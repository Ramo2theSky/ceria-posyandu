-- CERIA - Admin role via server-controlled table + Auth Hook
-- Version: 2.0
-- Description: Replace user-editable user_metadata.role with admin_users table
--              and custom_access_token_hook claim `user_role`.

-- ============================================================
-- TABLE: admin_users (server-controlled admin registry)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.admin_users (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE
);

COMMENT ON TABLE public.admin_users IS
    'Daftar admin CERIA. Hanya dapat dimodifikasi via service_role (Dashboard/SQL).';

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- supabase_auth_admin perlu SELECT agar Auth Hook bisa membaca tabel ini.
-- Tidak ada policy untuk authenticated/anon — kader tidak bisa baca/tulis.
CREATE POLICY "auth_admin_baca_admin_users" ON public.admin_users
    AS PERMISSIVE
    FOR SELECT
    TO supabase_auth_admin
    USING (true);

REVOKE ALL ON TABLE public.admin_users FROM authenticated, anon, public;

GRANT ALL ON TABLE public.admin_users TO supabase_auth_admin;

-- service_role bypass RLS; insert/delete admin dilakukan via Dashboard/SQL dengan service key.

-- ============================================================
-- AUTH HOOK: custom_access_token_hook
-- ============================================================
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    claims jsonb;
    is_admin boolean;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM public.admin_users
        WHERE user_id = (event->>'user_id')::uuid
    ) INTO is_admin;

    claims := event->'claims';

    IF is_admin THEN
        claims := jsonb_set(claims, '{user_role}', '"admin"');
    ELSE
        claims := jsonb_set(claims, '{user_role}', '"kader"');
    END IF;

    event := jsonb_set(event, '{claims}', claims);

    RETURN event;
END;
$$;

GRANT USAGE ON SCHEMA public TO supabase_auth_admin;

GRANT EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb) TO supabase_auth_admin;

REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb)
    FROM authenticated, anon, public;

-- ============================================================
-- RLS: ganti klaim `role` -> `user_role` pada policy admin
-- ============================================================
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
    );

DROP POLICY IF EXISTS "admin_hard_delete" ON public.pemeriksaan;
CREATE POLICY "admin_hard_delete" ON public.pemeriksaan
    FOR DELETE USING (
        auth.role() = 'authenticated'
        AND (auth.jwt() ->> 'user_role') = 'admin'
    );

DROP POLICY IF EXISTS "admin_baca_semua" ON public.pemeriksaan;
CREATE POLICY "admin_baca_semua" ON public.pemeriksaan
    FOR SELECT USING (
        auth.role() = 'authenticated'
        AND (auth.jwt() ->> 'user_role') = 'admin'
    );