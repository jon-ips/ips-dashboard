-- ============================================================================
-- jobs  --  Job orders logged by the workspace (Provisions, Waste, Turnaround)
-- Icelandic Port Services (IPS) Dashboard
--
-- This table was originally created ad-hoc in Supabase Studio when the
-- Workspace jobs feature shipped (commit 1ea73e9, "Sync jobs to Supabase for
-- shared access between users"). Two schema bugs slipped in via that ad-hoc
-- creation:
--   - hours_worked was typed as numeric instead of jsonb
--   - the type CHECK constraint allowed only 'provisions'
-- which are fixed by the follow-up migrations 20260601120000 and 20260601130000.
--
-- This file documents the intended shape so a fresh Supabase project can be
-- rebuilt from migrations alone. Uses CREATE TABLE IF NOT EXISTS so it is
-- safe to apply on the existing live database (which already has the table).
-- The follow-up fix migrations are idempotent and become no-ops once this
-- file's correct schema is in place.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.jobs (
    id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    type          TEXT         NOT NULL DEFAULT 'provisions'
                               CHECK (type IN ('provisions', 'waste', 'turnaround')),
    date          DATE         NOT NULL,
    ship          TEXT,
    notes         TEXT,
    shifts        JSONB        NOT NULL DEFAULT '[]'::jsonb,
    completed     BOOLEAN      NOT NULL DEFAULT false,
    hours_worked  JSONB,
    created_by    UUID,
    created_at    TIMESTAMPTZ  DEFAULT now(),
    updated_at    TIMESTAMPTZ  DEFAULT now(),
    deleted_at    TIMESTAMPTZ
);

COMMENT ON TABLE  public.jobs              IS 'Job orders logged from the Workspace: provisions, waste offload, or turnaround ops.';
COMMENT ON COLUMN public.jobs.type         IS 'Job category. Keep in sync with JOB_TYPES in src/constants.js.';
COMMENT ON COLUMN public.jobs.date         IS 'Date the job is scheduled / performed.';
COMMENT ON COLUMN public.jobs.ship         IS 'Free-text ship label, typically "<Ship> (<Cruise line>)".';
COMMENT ON COLUMN public.jobs.shifts       IS 'Array of { startTime, equipment: { <key>: <qty> } } — one entry per shift.';
COMMENT ON COLUMN public.jobs.completed    IS 'True once the operator has confirmed the job is done.';
COMMENT ON COLUMN public.jobs.hours_worked IS 'Array of { startTime, equipment: { <key>: [{ qty, hours }] } } — filled in on completion.';
COMMENT ON COLUMN public.jobs.created_by   IS 'Reserved for future auth integration; currently always null.';
COMMENT ON COLUMN public.jobs.deleted_at   IS 'Soft-delete timestamp; NULL means the job is active.';


-- ============================================================================
-- Indexes
-- ============================================================================

-- Filter by date for the upcoming/calendar views
CREATE INDEX IF NOT EXISTS idx_jobs_date       ON public.jobs (date);

-- Quickly partition active vs completed jobs
CREATE INDEX IF NOT EXISTS idx_jobs_completed  ON public.jobs (completed);

-- Soft-delete partial index: only the non-deleted rows are read in the hot path
CREATE INDEX IF NOT EXISTS idx_jobs_deleted_at ON public.jobs (deleted_at);
