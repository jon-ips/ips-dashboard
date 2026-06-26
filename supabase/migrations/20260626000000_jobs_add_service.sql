-- ============================================================================
-- jobs.service  --  Per-service "no job" markers
--
-- The Workspace writes a `service` field on job rows (used so a single
-- service slot — provisions / waste / turnaround — can be marked "no job"
-- independently of the others on the same call). The column was referenced
-- in code (rowToJob, confirmNoJob, the background-sync insert) but never
-- added to the jobs table, so PostgREST rejected every insert that carried
-- it with "Could not find the 'service' column of 'jobs' in the schema
-- cache", which blocked background sync between users.
--
-- Idempotent: safe to run on the live database and in a fresh rebuild.
-- ============================================================================

ALTER TABLE public.jobs
    ADD COLUMN IF NOT EXISTS service TEXT;

COMMENT ON COLUMN public.jobs.service IS
    'For no_job markers: which service slot is opted out (provisions/waste/turnaround). NULL = whole-call marker or a normal job.';

-- Ask PostgREST to reload its schema cache so the new column is visible
-- immediately without waiting for the periodic refresh.
NOTIFY pgrst, 'reload schema';
