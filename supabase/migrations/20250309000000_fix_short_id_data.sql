/*
  # Fix Short IDs Data
  
  ## Query Description: 
  This migration ensures that the 'short_id' column exists and is populated for ALL prompts.
  It fixes the issue where some prompts might still be showing letter-based IDs (UUIDs) instead of 5-digit numbers.
  
  1. Ensures the sequence 'prompts_short_id_seq' exists and starts at 10000.
  2. Adds the 'short_id' column if it's missing.
  3. Backfills any NULL 'short_id' values with new numbers from the sequence.
  4. Syncs the sequence to the maximum existing ID to prevent conflicts.
  5. Adds a unique constraint to prevent duplicate IDs.

  ## Metadata:
  - Schema-Category: "Data"
  - Impact-Level: "Medium"
  - Requires-Backup: false
  - Reversible: true
*/

-- 1. Ensure the sequence exists
CREATE SEQUENCE IF NOT EXISTS prompts_short_id_seq START WITH 10000;

-- 2. Ensure the column exists (Idempotent check)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'prompts' AND column_name = 'short_id') THEN
        ALTER TABLE prompts ADD COLUMN short_id BIGINT DEFAULT nextval('prompts_short_id_seq');
    END IF;
END $$;

-- 3. Set the default value for the column to use the sequence
ALTER TABLE prompts ALTER COLUMN short_id SET DEFAULT nextval('prompts_short_id_seq');

-- 4. Backfill existing NULL values (This fixes the "bfafc" letter ID issue)
UPDATE prompts 
SET short_id = nextval('prompts_short_id_seq') 
WHERE short_id IS NULL;

-- 5. Sync the sequence to the max value (Safety step)
SELECT setval('prompts_short_id_seq', COALESCE((SELECT MAX(short_id) FROM prompts), 10000) + 1);

-- 6. Add unique constraint if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'prompts_short_id_key') THEN
        ALTER TABLE prompts ADD CONSTRAINT prompts_short_id_key UNIQUE (short_id);
    END IF;
END $$;
