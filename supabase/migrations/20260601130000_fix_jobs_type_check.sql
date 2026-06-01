-- ============================================================================
-- Relax jobs.type CHECK constraint
-- Icelandic Port Services (IPS) Dashboard
--
-- The jobs table's type CHECK constraint was created allowing only
-- 'provisions', so any 'waste' or 'turnaround' job (both valid job types
-- in the app's JOB_TYPES config) is rejected on insert with:
--   new row for relation "jobs" violates check constraint "jobs_type_check"
--
-- Keep the values in sync with JOB_TYPES in src/constants.js when new
-- job types are added.
-- ============================================================================

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE  conname  = 'jobs_type_check'
        AND    conrelid = 'public.jobs'::regclass
    ) THEN
        ALTER TABLE public.jobs DROP CONSTRAINT jobs_type_check;
    END IF;

    ALTER TABLE public.jobs
        ADD CONSTRAINT jobs_type_check
        CHECK (type IN ('provisions', 'waste', 'turnaround'));
END $$;
