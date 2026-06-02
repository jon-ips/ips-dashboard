-- ============================================================================
-- Seed cruise_lines.payday_customer_id
--
-- Mappings supplied by Jón. Three things to note:
--   1. Seabourn and Holland America share one Payday customer (SBN/HAL).
--   2. SDK is an umbrella customer that gets invoiced for several lines:
--      Aida, Ambassador, Costa, Cunard, Hapag-Lloyd, P&O, Phoenix Reisen, TUI.
--      Every one of those cruise_lines rows points at the SDK customer ID
--      so invoices addressed to e.g. "TUI" land on the SDK Payday account.
--   3. Faxaflóahafnir is the port authority, invoiced directly when needed.
--
-- Idempotent: re-running this migration is safe — the UPDATEs are static
-- assignments. If a Payday customer ID changes, edit here and re-apply.
-- ============================================================================

-- Direct customers (one cruise_lines row → one Payday customer)
UPDATE public.cruise_lines SET payday_customer_id = 'c74249ab-ec79-4997-886a-4b5201a4703f' WHERE name = 'Faxaflóahafnir';
UPDATE public.cruise_lines SET payday_customer_id = '48513991-e75f-45d3-9f0b-c764b0402c09' WHERE name = 'Viking';

-- SBN/HAL share one Payday customer
UPDATE public.cruise_lines SET payday_customer_id = 'a380253c-3a7f-41a1-907d-17c0fe2215c1'
  WHERE name IN ('Seabourn', 'Holland America');

-- SDK umbrella — bills for all of these cruise lines
UPDATE public.cruise_lines SET payday_customer_id = 'e09b4afc-4fe5-4239-aef5-44509e338f70'
  WHERE name IN ('Aida', 'Ambassador', 'Costa', 'Cunard', 'Hapag-Lloyd', 'P&O', 'Phoenix Reisen', 'TUI');
