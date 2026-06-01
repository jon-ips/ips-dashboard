-- ============================================================================
-- Fix jobs.hours_worked column type
-- Icelandic Port Services (IPS) Dashboard
--
-- The jobs table was originally created manually in Supabase Studio rather
-- than via migration, and hours_worked was set to numeric. The application
-- stores per-shift completion data as JSON of the shape:
--   [{ "startTime": "14:30", "equipment": { "telescopic": [{"qty":1,"hours":4}] } }]
-- so every completion write was failing with:
--   invalid input syntax for type numeric: "[{...}]"
--
-- This migration converts the column to jsonb so completions persist and
-- sync across users. Idempotent: only runs the ALTER if needed.
-- ============================================================================

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM   information_schema.columns
        WHERE  table_schema = 'public'
        AND    table_name   = 'jobs'
        AND    column_name  = 'hours_worked'
        AND    data_type    <> 'jsonb'
    ) THEN
        ALTER TABLE public.jobs
            ALTER COLUMN hours_worked
            TYPE jsonb USING NULL;
    END IF;
END $$;
