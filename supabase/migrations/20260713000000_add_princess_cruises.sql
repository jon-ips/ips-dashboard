-- ============================================================================
-- Add Princess Cruises as a contracted cruise line, mirroring SBN/HAL setup
--
-- Princess Cruises has been added to Payday as a separate customer (UUID
-- 5a86b65b-3778-426c-a587-b9d28624bed1) and uses the same rate sheet, VAT
-- treatment (0%, international transit), and payment terms (30 days) as
-- Seabourn and Holland America.
--
-- The existing `Princess` cruise_lines row (seeded originally with status
-- 'other' as a prospect placeholder) is renamed in place so any ships /
-- port_calls that reference it via FK stay linked. If the row doesn't
-- exist (fresh Supabase install), the INSERT below creates it.
--
-- Idempotent: safe to re-run.
-- ============================================================================

-- 1. Rename the existing 'Princess' row → 'Princess Cruises' and upgrade
--    its status / payment terms / Payday mapping. Guard against the
--    hypothetical case where both names already exist (unique index on
--    cruise_lines.name would otherwise fail).
UPDATE public.cruise_lines
   SET name               = 'Princess Cruises',
       status             = 'contracted',
       payment_terms_days = 30,
       payday_customer_id = '5a86b65b-3778-426c-a587-b9d28624bed1'
 WHERE name = 'Princess'
   AND NOT EXISTS (SELECT 1 FROM public.cruise_lines WHERE name = 'Princess Cruises');

-- 2. Fresh install (or already-renamed row) — ensure a correctly-configured
--    Princess Cruises row exists. ON CONFLICT DO UPDATE also fixes any
--    partially-migrated row that may have been renamed but missed the
--    Payday mapping.
INSERT INTO public.cruise_lines (name, status, payment_terms_days, payday_customer_id)
VALUES ('Princess Cruises', 'contracted', 30, '5a86b65b-3778-426c-a587-b9d28624bed1')
    ON CONFLICT (name) DO UPDATE
   SET status             = 'contracted',
       payment_terms_days = 30,
       payday_customer_id = '5a86b65b-3778-426c-a587-b9d28624bed1';
