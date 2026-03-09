-- ============================================================================
-- Phase 2 CFO Workspace Migration
-- Icelandic Port Services (IPS) Dashboard
--
-- Creates financial tables for contract management, invoicing,
-- expense tracking, staff registry, and payroll.
--
-- NOTE: Row Level Security (RLS) is intentionally omitted and will be
-- added in a later migration phase.
-- ============================================================================


-- ============================================================================
-- 1. contracts  --  Service agreements per cruise line per season
-- ============================================================================
CREATE TABLE contracts (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    cruise_line_id  UUID        NOT NULL REFERENCES cruise_lines(id),
    season          TEXT        NOT NULL,
    status          TEXT        DEFAULT 'draft'
                                CHECK (status IN ('draft', 'active', 'expired', 'cancelled')),
    signed_date     DATE,
    start_date      DATE        NOT NULL,
    end_date        DATE        NOT NULL,
    payment_terms   TEXT,
    notes           TEXT,
    created_at      TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE  contracts                  IS 'Service contracts with cruise lines, one per season.';
COMMENT ON COLUMN contracts.season           IS 'Season identifier, e.g. 2026.';
COMMENT ON COLUMN contracts.status           IS 'Contract lifecycle: draft, active, expired, or cancelled.';
COMMENT ON COLUMN contracts.payment_terms    IS 'Payment terms, e.g. Net 30.';


-- ============================================================================
-- 2. rate_cards  --  Pricing per service/resource within a contract
-- ============================================================================
CREATE TABLE rate_cards (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id     UUID        NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    service_type    TEXT        NOT NULL
                                CHECK (service_type IN ('luggage_handling', 'provision_loading', 'waste_offload', 'other')),
    description     TEXT,
    unit            TEXT        NOT NULL
                                CHECK (unit IN ('per_pax', 'per_pallet', 'per_call', 'per_hour', 'flat')),
    rate_isk        NUMERIC(12,2) NOT NULL,
    min_charge_isk  NUMERIC(12,2) DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE  rate_cards                 IS 'Individual rate items within a contract.';
COMMENT ON COLUMN rate_cards.service_type    IS 'Service category: luggage_handling, provision_loading, waste_offload, or other.';
COMMENT ON COLUMN rate_cards.unit            IS 'Billing unit: per_pax, per_pallet, per_call, per_hour, or flat.';
COMMENT ON COLUMN rate_cards.rate_isk        IS 'Unit price in ISK.';
COMMENT ON COLUMN rate_cards.min_charge_isk  IS 'Minimum charge per call in ISK (0 = no minimum).';


-- ============================================================================
-- 3. invoices  --  Billing documents tied to port calls
-- ============================================================================
CREATE TABLE invoices (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number  TEXT        NOT NULL UNIQUE,
    contract_id     UUID        REFERENCES contracts(id),
    cruise_line_id  UUID        NOT NULL REFERENCES cruise_lines(id),
    port_call_id    UUID        REFERENCES port_calls(id),
    status          TEXT        DEFAULT 'draft'
                                CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
    issue_date      DATE        NOT NULL,
    due_date        DATE        NOT NULL,
    subtotal_isk    NUMERIC(14,2) DEFAULT 0,
    tax_isk         NUMERIC(14,2) DEFAULT 0,
    total_isk       NUMERIC(14,2) DEFAULT 0,
    paid_date       DATE,
    notes           TEXT,
    created_at      TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE  invoices                   IS 'Invoices issued to cruise lines, typically one per port call.';
COMMENT ON COLUMN invoices.invoice_number    IS 'Unique invoice reference, e.g. IPS-2026-0001.';
COMMENT ON COLUMN invoices.status            IS 'Invoice lifecycle: draft, sent, paid, overdue, or cancelled.';
COMMENT ON COLUMN invoices.subtotal_isk      IS 'Sum of line items before tax in ISK.';
COMMENT ON COLUMN invoices.tax_isk           IS 'Tax amount in ISK.';
COMMENT ON COLUMN invoices.total_isk         IS 'Total amount due in ISK (subtotal + tax).';


-- ============================================================================
-- 4. invoice_lines  --  Individual billable items on an invoice
-- ============================================================================
CREATE TABLE invoice_lines (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id      UUID        NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    rate_card_id    UUID        REFERENCES rate_cards(id),
    description     TEXT        NOT NULL,
    quantity        NUMERIC(10,2) NOT NULL DEFAULT 1,
    unit_price_isk  NUMERIC(12,2) NOT NULL,
    line_total_isk  NUMERIC(14,2) NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE  invoice_lines                  IS 'Individual line items within an invoice.';
COMMENT ON COLUMN invoice_lines.rate_card_id     IS 'Optional link to the rate card this line was generated from.';
COMMENT ON COLUMN invoice_lines.line_total_isk   IS 'Calculated total: quantity * unit_price_isk.';


-- ============================================================================
-- 5. expenses  --  Operational costs (recurring and one-time)
-- ============================================================================
CREATE TABLE expenses (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    category        TEXT        NOT NULL
                                CHECK (category IN ('payroll', 'equipment', 'fuel', 'maintenance', 'insurance', 'rent', 'utilities', 'other')),
    description     TEXT        NOT NULL,
    amount_isk      NUMERIC(14,2) NOT NULL,
    expense_date    DATE        NOT NULL,
    recurring       BOOLEAN     DEFAULT false,
    recurrence      TEXT        CHECK (recurrence IN ('monthly', 'quarterly', 'annual') OR recurrence IS NULL),
    vendor          TEXT,
    notes           TEXT,
    created_at      TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE  expenses                   IS 'Operational expenses, both recurring and one-time.';
COMMENT ON COLUMN expenses.category          IS 'Expense category for reporting.';
COMMENT ON COLUMN expenses.recurring         IS 'True if this expense repeats on a schedule.';
COMMENT ON COLUMN expenses.recurrence        IS 'Frequency: monthly, quarterly, or annual (NULL if not recurring).';


-- ============================================================================
-- 6. staff  --  Team and contractor registry
-- ============================================================================
CREATE TABLE staff (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name                TEXT        NOT NULL,
    role                TEXT        NOT NULL,
    type                TEXT        DEFAULT 'employee'
                                    CHECK (type IN ('employee', 'contractor', 'seasonal')),
    hourly_rate_isk     NUMERIC(10,2),
    monthly_salary_isk  NUMERIC(12,2),
    active              BOOLEAN     DEFAULT true,
    phone               TEXT,
    email               TEXT,
    notes               TEXT,
    created_at          TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE  staff                      IS 'IPS team members and contractors.';
COMMENT ON COLUMN staff.role                 IS 'Job role, e.g. manager, stevedore, driver, crane_operator.';
COMMENT ON COLUMN staff.type                 IS 'Employment type: employee, contractor, or seasonal.';
COMMENT ON COLUMN staff.hourly_rate_isk      IS 'Hourly rate in ISK (for hourly workers).';
COMMENT ON COLUMN staff.monthly_salary_isk   IS 'Monthly salary in ISK (for salaried workers).';


-- ============================================================================
-- 7. payroll_entries  --  Payroll period tracking
-- ============================================================================
CREATE TABLE payroll_entries (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id        UUID        NOT NULL REFERENCES staff(id),
    period_start    DATE        NOT NULL,
    period_end      DATE        NOT NULL,
    hours_worked    NUMERIC(8,2),
    gross_isk       NUMERIC(14,2) NOT NULL,
    deductions_isk  NUMERIC(14,2) DEFAULT 0,
    net_isk         NUMERIC(14,2) NOT NULL,
    status          TEXT        DEFAULT 'pending'
                                CHECK (status IN ('pending', 'approved', 'paid')),
    paid_date       DATE,
    notes           TEXT,
    created_at      TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE  payroll_entries                IS 'Payroll records per staff member per period.';
COMMENT ON COLUMN payroll_entries.hours_worked   IS 'Total hours worked in the period.';
COMMENT ON COLUMN payroll_entries.gross_isk      IS 'Gross pay in ISK before deductions.';
COMMENT ON COLUMN payroll_entries.deductions_isk IS 'Total deductions in ISK.';
COMMENT ON COLUMN payroll_entries.net_isk        IS 'Net pay in ISK after deductions.';


-- ============================================================================
-- Indexes
-- ============================================================================

-- Contracts
CREATE INDEX idx_contracts_cruise_line  ON contracts (cruise_line_id);
CREATE INDEX idx_contracts_status       ON contracts (status);

-- Rate cards
CREATE INDEX idx_rate_cards_contract    ON rate_cards (contract_id);

-- Invoices
CREATE INDEX idx_invoices_cruise_line   ON invoices (cruise_line_id);
CREATE INDEX idx_invoices_port_call     ON invoices (port_call_id);
CREATE INDEX idx_invoices_status        ON invoices (status);
CREATE INDEX idx_invoices_issue_date    ON invoices (issue_date);

-- Invoice lines
CREATE INDEX idx_invoice_lines_invoice  ON invoice_lines (invoice_id);

-- Expenses
CREATE INDEX idx_expenses_date          ON expenses (expense_date);
CREATE INDEX idx_expenses_category      ON expenses (category);

-- Staff
CREATE INDEX idx_staff_active           ON staff (active);

-- Payroll
CREATE INDEX idx_payroll_staff          ON payroll_entries (staff_id);
CREATE INDEX idx_payroll_period         ON payroll_entries (period_start);
