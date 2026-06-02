-- ============================================================================
-- Restore cherry_picker to jobs.type CHECK
--
-- An out-of-band SQL block reset the CHECK constraint to only allow
-- ('provisions','waste','turnaround','special') — pre-dating the
-- cherry_picker work. Widen it so cherry_picker jobs can be inserted again.
-- Idempotent: drops whatever %type% CHECK is currently in place before
-- adding the new one.
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
    CHECK (type IN ('provisions', 'waste', 'turnaround', 'cherry_picker', 'special'));
