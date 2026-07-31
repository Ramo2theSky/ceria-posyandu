-- CERIA - Activity Log
-- Version: 6.0
-- Description: Track user actions for audit trail

CREATE TABLE IF NOT EXISTS activity_log (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID REFERENCES auth.users(id),
    user_email  TEXT,
    action      TEXT NOT NULL,       -- 'insert', 'update', 'delete'
    target_nik  VARCHAR(16),
    detail      TEXT,                -- deskripsi singkat, mis. "Data warga 3309xxxx berhasil disimpan"
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_read_log" ON activity_log
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "authenticated_insert_log" ON activity_log
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE INDEX IF NOT EXISTS idx_activity_log_created ON activity_log (created_at DESC);
