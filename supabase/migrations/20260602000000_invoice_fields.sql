-- ============================================================================
-- Invoice generator support
--
-- Adds fields needed to draft a Payday invoice from a completed job:
--   - jobs.cruise_line_id  → which customer (Payday) gets billed
--   - jobs.po_number       → required, goes into the Payday "Tilvísun"
--                            (reference) field as "{po} {service_code}"
--   - jobs.berth           → quay/berth label used in the invoice comment
--   - jobs.type            → CHECK constraint widened to include
--                            'cherry_picker' (Cherry Picker rental)
--
-- Adds:
--   - port_calls.berth          → master berth so jobs can auto-fill it
--   - cruise_lines.payment_terms_days → days between invoice date and due date
--                                       (SDK lines = 21, Seabourn/HAL/Viking
--                                       = 30, Faxaflóahafnir = 20, default 30)
--   - cruise_lines row for Faxaflóahafnir, the harbour authority (sometimes
--     invoiced directly). payday_customer_id left NULL — fill in via the UI
--     when the mapping is known.
--
-- Idempotent: every clause guards with IF (NOT) EXISTS so re-running is safe.
-- ============================================================================


-- ─── jobs: new columns ───────────────────────────────────────────────────────
ALTER TABLE public.jobs
    ADD COLUMN IF NOT EXISTS cruise_line_id UUID REFERENCES public.cruise_lines(id),
    ADD COLUMN IF NOT EXISTS po_number      TEXT,
    ADD COLUMN IF NOT EXISTS berth          TEXT;

COMMENT ON COLUMN public.jobs.cruise_line_id IS
    'FK to cruise_lines. Required before the job can be invoiced — maps to the Payday customer via cruise_lines.payday_customer_id.';
COMMENT ON COLUMN public.jobs.po_number IS
    'Customer purchase order number. Required before invoicing; goes into Payday reference as "{po} {service_code}" (W/P/L/CP).';
COMMENT ON COLUMN public.jobs.berth IS
    'Berth label (e.g. "VÖR", "SKB"). Auto-filled from port_calls.berth when the job is linked to a known port call; editable.';

CREATE INDEX IF NOT EXISTS idx_jobs_cruise_line_id ON public.jobs (cruise_line_id);


-- ─── jobs.type: widen CHECK to include cherry_picker ─────────────────────────
-- Drop the existing constraint (regardless of which migration created it) and
-- re-add with the cherry_picker option. NOT VALID is unnecessary here because
-- existing rows all use one of provisions/waste/turnaround.
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
    CHECK (type IN ('provisions', 'waste', 'turnaround', 'cherry_picker'));


-- ─── port_calls: berth ───────────────────────────────────────────────────────
ALTER TABLE public.port_calls
    ADD COLUMN IF NOT EXISTS berth TEXT;

COMMENT ON COLUMN public.port_calls.berth IS
    'Quay/berth assignment for the visit (e.g. "VÖR", "SKB", "Skarfabakki"). Manually maintained.';


-- ─── cruise_lines: payment_terms_days + seed values ──────────────────────────
ALTER TABLE public.cruise_lines
    ADD COLUMN IF NOT EXISTS payment_terms_days INT NOT NULL DEFAULT 30;

COMMENT ON COLUMN public.cruise_lines.payment_terms_days IS
    'Days from invoice date to due date. Seeded: SDK lines = 21, Seabourn/HAL/Viking = 30, Faxaflóahafnir = 20, everyone else = 30 default.';

-- Faxaflóahafnir (port authority) — sometimes invoiced directly.
INSERT INTO public.cruise_lines (name, status, payment_terms_days)
VALUES ('Faxaflóahafnir', 'other', 20)
ON CONFLICT (name) DO NOTHING;

-- SDK group: 21 days
UPDATE public.cruise_lines SET payment_terms_days = 21
WHERE name IN ('Aida', 'Ambassador', 'Costa', 'Cunard', 'Hapag-Lloyd',
               'P&O', 'Phoenix Reisen', 'TUI');

-- Big contracted lines: 30 days (also the default, but make it explicit)
UPDATE public.cruise_lines SET payment_terms_days = 30
WHERE name IN ('Seabourn', 'Holland America', 'Viking');

-- Faxaflóahafnir: 20 (already set on insert, but enforce on re-run)
UPDATE public.cruise_lines SET payment_terms_days = 20
WHERE name = 'Faxaflóahafnir';
