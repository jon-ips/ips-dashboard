CREATE TABLE jobs (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  port_call_id    UUID        REFERENCES port_calls(id),
  contract_id     UUID        REFERENCES contracts(id),
  cruise_line_id  UUID        REFERENCES cruise_lines(id),
  ship_name       TEXT        NOT NULL,
  call_date       DATE        NOT NULL,
  end_date        DATE,
  planned_pax     INTEGER,
  turnaround      BOOLEAN     DEFAULT false,
  status          TEXT        DEFAULT 'pending'
                              CHECK (status IN ('pending','confirmed','completed','invoiced')),
  confirmed_hours NUMERIC(6,2),
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);
