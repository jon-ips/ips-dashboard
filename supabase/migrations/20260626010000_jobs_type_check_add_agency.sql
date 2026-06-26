-- ============================================================================
-- Widen jobs.type CHECK to every type the Workspace persists
--
-- The previous constraint only allowed
-- ('provisions','waste','turnaround','cherry_picker','special'), so inserts
-- of bindingar / no_job / agency rows failed the check and saved only to the
-- creating user's device — never syncing to coworkers. Agency (Akureyri
-- boarding-agent) jobs are the latest casualty.
--
-- Idempotent: drops whatever %type% CHECK is in place, then re-adds the full
-- list. Safe on the live database and in a fresh rebuild.
-- ============================================================================

DO $$
DECLARE
    cn TEXT;
BEGIN
    SELECT conname INTO cn
    FROM pg_constraint
    WHERE conrelid = 'public.jobs'::regclass
      AND contype  = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%type%';
    IF cn IS NOT NULL THEN
        EXECUTE format('ALTER TABLE public.jobs DROP CONSTRAINT %I', cn);
    END IF;
END $$;

ALTER TABLE public.jobs
    ADD CONSTRAINT jobs_type_check
    CHECK (type IN ('provisions', 'waste', 'turnaround', 'cherry_picker', 'special', 'bindingar', 'no_job', 'agency'));

NOTIFY pgrst, 'reload schema';
