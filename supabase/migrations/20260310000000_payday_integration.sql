-- ============================================================================
-- Payday.is Integration Migration
-- Adds Payday customer mapping, sync tracking columns, and audit log.
-- ============================================================================

-- Map cruise lines to Payday customer records
ALTER TABLE cruise_lines ADD COLUMN payday_customer_id TEXT;
CREATE INDEX idx_cruise_lines_payday ON cruise_lines (payday_customer_id);

-- Track synced invoices from Payday
ALTER TABLE invoices ADD COLUMN payday_invoice_id TEXT;
ALTER TABLE invoices ADD COLUMN payday_synced_at TIMESTAMPTZ;
CREATE INDEX idx_invoices_payday ON invoices (payday_invoice_id);

-- Track synced expenses from Payday
ALTER TABLE expenses ADD COLUMN payday_expense_id TEXT;
ALTER TABLE expenses ADD COLUMN payday_synced_at TIMESTAMPTZ;
CREATE INDEX idx_expenses_payday ON expenses (payday_expense_id);

-- Sync audit log — tracks every sync operation
CREATE TABLE payday_sync_log (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    sync_type       TEXT        NOT NULL
                                CHECK (sync_type IN ('customers', 'invoices', 'expenses', 'payments')),
    status          TEXT        NOT NULL
                                CHECK (status IN ('started', 'completed', 'failed')),
    records_synced  INT         DEFAULT 0,
    error_message   TEXT,
    started_at      TIMESTAMPTZ DEFAULT now(),
    completed_at    TIMESTAMPTZ
);

COMMENT ON TABLE payday_sync_log IS 'Audit trail for Payday API sync operations.';
