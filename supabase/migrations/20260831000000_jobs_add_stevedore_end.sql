-- ============================================================================
-- jobs.stevedore_end  --  Finish-time proposal from the stevedore view
--
-- The no-PIN stevedore overview (?view=stevedore) has a "Finish" button on
-- each job: the stevedore picks the time the job actually ended and it is
-- written here. The Workspace completion flows (desktop Complete Job modal
-- and the phone quick-complete) read it back and prefill the hours worked
-- (start time -> stevedore_end, rounded to the half hour, min 4h) so the
-- office side just confirms instead of guessing.
--
-- Plain "HH:MM" text, NULL when the stevedore hasn't reported a finish.
-- It is a proposal only — completion always goes through the normal flows.
--
-- Idempotent: safe to run on the live database and in a fresh rebuild.
-- ============================================================================

ALTER TABLE public.jobs
    ADD COLUMN IF NOT EXISTS stevedore_end TEXT;

COMMENT ON COLUMN public.jobs.stevedore_end IS
    'Finish time ("HH:MM") reported from the stevedore view; a proposal for the completion flows, not the recorded hours.';

-- Ask PostgREST to reload its schema cache so the new column is visible
-- immediately without waiting for the periodic refresh.
NOTIFY pgrst, 'reload schema';
