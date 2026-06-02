-- ============================================================================
-- Add port column to jobs (Reykjavík / Akureyri)
-- Icelandic Port Services (IPS) Dashboard
--
-- Some jobs are performed at Akureyri rather than Reykjavík. The workspace
-- now exposes a REY / AK port toggle on the new-job form; this column
-- backs that field so jobs sync the choice between users. Defaults to REY
-- so existing rows keep their effective port.
-- ============================================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM   information_schema.columns
        WHERE  table_schema = 'public'
        AND    table_name   = 'jobs'
        AND    column_name  = 'port'
    ) THEN
        ALTER TABLE public.jobs
            ADD COLUMN port TEXT NOT NULL DEFAULT 'REY'
            CHECK (port IN ('REY', 'AK'));
    END IF;
END $$;
