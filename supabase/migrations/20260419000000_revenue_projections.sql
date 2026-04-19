-- ============================================================================
-- Revenue Projection Templates
-- Icelandic Port Services (IPS) Dashboard
--
-- Stores resource-level breakdowns for cruise ship port calls so that
-- projected revenue can be computed as a sum of (amount * time_units *
-- unit_price_isk) across all resources in each section (provision loading,
-- luggage operations, waste offload).
--
-- A template applies to either a specific ship OR to every ship in a cruise
-- line (for lines like Viking or TUI/Mein Schiff that use one fleet-wide
-- template). Exactly one of ship_id / cruise_line_id must be set.
--
-- Rates differ between weekdays (daytime) and weekends (overtime), so each
-- template is keyed on (target, call_type, day_type).
-- ============================================================================


-- ============================================================================
-- 1. projection_templates  --  One row per ship-or-line × call_type × day_type
-- ============================================================================
CREATE TABLE projection_templates (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    ship_id         UUID        REFERENCES ships(id)        ON DELETE CASCADE,
    cruise_line_id  UUID        REFERENCES cruise_lines(id) ON DELETE CASCADE,
    call_type       TEXT        NOT NULL
                                CHECK (call_type IN ('turnaround', 'transit')),
    day_type        TEXT        NOT NULL
                                CHECK (day_type IN ('weekday', 'weekend')),
    notes           TEXT,
    created_at      TIMESTAMPTZ DEFAULT now(),

    CHECK ((ship_id IS NOT NULL) <> (cruise_line_id IS NOT NULL))
);

CREATE UNIQUE INDEX projection_templates_ship_unique
    ON projection_templates (ship_id, call_type, day_type)
    WHERE ship_id IS NOT NULL;

CREATE UNIQUE INDEX projection_templates_line_unique
    ON projection_templates (cruise_line_id, call_type, day_type)
    WHERE cruise_line_id IS NOT NULL;

COMMENT ON TABLE  projection_templates      IS 'Resource projection templates keyed on ship-or-line, call type, and day type.';
COMMENT ON COLUMN projection_templates.ship_id        IS 'Ship this template applies to. Mutually exclusive with cruise_line_id.';
COMMENT ON COLUMN projection_templates.cruise_line_id IS 'Cruise line this template applies to (covers all ships in the line). Mutually exclusive with ship_id.';
COMMENT ON COLUMN projection_templates.call_type      IS 'Call type: turnaround or transit.';
COMMENT ON COLUMN projection_templates.day_type       IS 'Weekday (daytime rates) or weekend (overtime rates).';


-- ============================================================================
-- 2. projection_resources  --  Individual resource lines within a template
-- ============================================================================
CREATE TABLE projection_resources (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id     UUID        NOT NULL REFERENCES projection_templates(id) ON DELETE CASCADE,
    section         TEXT        NOT NULL
                                CHECK (section IN ('provision_loading', 'luggage_operations', 'waste_offload')),
    resource_name   TEXT        NOT NULL,
    amount          NUMERIC(10,2) NOT NULL DEFAULT 0,
    time_units      NUMERIC(10,2) NOT NULL DEFAULT 0,
    unit_price_isk  NUMERIC(12,2) NOT NULL DEFAULT 0,
    sort_order      INT         NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX projection_resources_template_idx
    ON projection_resources (template_id, section, sort_order);

COMMENT ON TABLE  projection_resources                IS 'Individual resource rows within a projection template. Total = amount * time_units * unit_price_isk.';
COMMENT ON COLUMN projection_resources.section        IS 'Operational section: provision_loading, luggage_operations, or waste_offload.';
COMMENT ON COLUMN projection_resources.resource_name  IS 'Free-text resource name (e.g. "Forklift Driver (Overtime)", "Flat fee").';
COMMENT ON COLUMN projection_resources.amount         IS 'Quantity (e.g. 3 forklifts).';
COMMENT ON COLUMN projection_resources.time_units     IS 'Duration in hours (or 1 for flat-charge items).';
COMMENT ON COLUMN projection_resources.unit_price_isk IS 'Unit price in ISK per time-unit per amount.';
COMMENT ON COLUMN projection_resources.sort_order     IS 'Display order within the section (preserves input order for duplicate resource names).';
