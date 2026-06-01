-- ============================================================================
-- Allow 'special' as a valid jobs.type
-- Icelandic Port Services (IPS) Dashboard
--
-- Adds the new "Special operation" job type to the jobs_type_check constraint
-- so jobs of this type can be inserted. Keeps the constraint in sync with
-- JOB_TYPES in src/constants.js (provisions, waste, turnaround, special).
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
        CHECK (type IN ('provisions', 'waste', 'turnaround', 'special'));
END $$;
