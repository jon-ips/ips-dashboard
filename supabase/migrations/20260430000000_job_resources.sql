ALTER TABLE jobs
  ADD COLUMN requested_resources jsonb NOT NULL DEFAULT '[]'::jsonb;
