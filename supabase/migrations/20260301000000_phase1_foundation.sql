-- ============================================================================
-- Phase 1 Foundation Migration
-- Icelandic Port Services (IPS) Dashboard
--
-- Creates the core tables for cruise line management, ship registry,
-- port call scheduling, and workspace task tracking.
--
-- NOTE: Row Level Security (RLS) is intentionally omitted and will be
-- added in a later migration phase.
-- ============================================================================


-- ============================================================================
-- 1. cruise_lines  --  Cruise line companies (e.g. Viking, TUI)
-- ============================================================================
CREATE TABLE cruise_lines (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT        NOT NULL UNIQUE,
    status          TEXT        DEFAULT 'other'
                                CHECK (status IN ('contracted', 'prospect', 'other')),
    contact_name    TEXT,
    contact_email   TEXT,
    notes           TEXT,
    created_at      TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE  cruise_lines                IS 'Cruise line companies that IPS works with or is prospecting.';
COMMENT ON COLUMN cruise_lines.status         IS 'Relationship status: contracted, prospect, or other.';
COMMENT ON COLUMN cruise_lines.contact_name   IS 'Primary contact person at the cruise line.';
COMMENT ON COLUMN cruise_lines.contact_email  IS 'Email address of the primary contact.';


-- ============================================================================
-- 2. ships  --  Ship registry linked to cruise lines
-- ============================================================================
CREATE TABLE ships (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT        NOT NULL,
    cruise_line_id  UUID        REFERENCES cruise_lines(id),
    pax_capacity    INT,
    created_at      TIMESTAMPTZ DEFAULT now(),

    UNIQUE (name, cruise_line_id)
);

COMMENT ON TABLE  ships               IS 'Individual ships in the fleet, each belonging to a cruise line.';
COMMENT ON COLUMN ships.name          IS 'Ship name (e.g. "Viking Mars").';
COMMENT ON COLUMN ships.pax_capacity  IS 'Maximum passenger capacity of the ship.';


-- ============================================================================
-- 3. port_calls  --  Individual port call visits (one row per ship visit)
-- ============================================================================
CREATE TABLE port_calls (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    ship_id     UUID        REFERENCES ships(id),
    date        DATE        NOT NULL,
    end_date    DATE,
    turnaround  BOOLEAN     DEFAULT false,
    pax         INT,
    status      TEXT        DEFAULT 'other'
                            CHECK (status IN ('contracted', 'prospect', 'other')),
    notes       TEXT,
    created_at  TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE  port_calls              IS 'Scheduled or completed port call visits by ships.';
COMMENT ON COLUMN port_calls.date         IS 'Arrival date of the port call.';
COMMENT ON COLUMN port_calls.end_date     IS 'Departure date; NULL means a single-day call.';
COMMENT ON COLUMN port_calls.turnaround   IS 'True if this is a turnaround call (embark/disembark).';
COMMENT ON COLUMN port_calls.pax          IS 'Actual passenger count for this specific call.';
COMMENT ON COLUMN port_calls.status       IS 'Booking status: contracted, prospect, or other.';


-- ============================================================================
-- 4. tasks  --  Workspace tasks (replaces localStorage-based task tracking)
-- ============================================================================
CREATE TABLE tasks (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    title           TEXT        NOT NULL,
    description     TEXT,
    assignee        TEXT,
    project         TEXT,
    priority        TEXT        DEFAULT 'medium'
                                CHECK (priority IN ('high', 'medium', 'low')),
    due_date        DATE,
    completed       BOOLEAN     DEFAULT false,
    completed_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE  tasks              IS 'Workspace tasks for the IPS team, replacing browser localStorage.';
COMMENT ON COLUMN tasks.assignee     IS 'Team member handle (e.g. jon, tristan).';
COMMENT ON COLUMN tasks.project      IS 'Project category (e.g. operations, sales, dashboard, general).';
COMMENT ON COLUMN tasks.priority     IS 'Task priority: high, medium, or low.';
COMMENT ON COLUMN tasks.completed_at IS 'Timestamp when the task was marked complete; NULL if still open.';


-- ============================================================================
-- 5. task_notes  --  Threaded notes / comments on tasks
-- ============================================================================
CREATE TABLE task_notes (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id     UUID        NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    author      TEXT        NOT NULL,
    text        TEXT        NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE  task_notes         IS 'Notes and comments attached to workspace tasks.';
COMMENT ON COLUMN task_notes.author  IS 'Author handle of the person who wrote the note.';
COMMENT ON COLUMN task_notes.text    IS 'Body text of the note.';


-- ============================================================================
-- Indexes
-- ============================================================================

-- Port calls: look up by date range (calendar views, season reports)
CREATE INDEX idx_port_calls_date    ON port_calls (date);

-- Port calls: look up all visits for a given ship
CREATE INDEX idx_port_calls_ship_id ON port_calls (ship_id);

-- Tasks: filter by assignee
CREATE INDEX idx_tasks_assignee     ON tasks (assignee);

-- Tasks: filter by project
CREATE INDEX idx_tasks_project      ON tasks (project);

-- Tasks: filter open vs completed tasks
CREATE INDEX idx_tasks_completed    ON tasks (completed);

-- Task notes: look up notes for a given task
CREATE INDEX idx_task_notes_task_id ON task_notes (task_id);
