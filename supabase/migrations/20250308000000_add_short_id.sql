/*
  # Add Short Numeric ID
  Adds a user-friendly 5-digit ID (starting at 10000) for easier reference and searching.

  ## Query Description:
  1. Creates a sequence starting at 10000
  2. Adds 'short_id' column to 'prompts' table
  3. Backfills existing rows with sequence values
  4. Adds unique constraint and index

  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "Medium"
  - Requires-Backup: false
  - Reversible: true
*/

-- 1. Create sequence starting at 10000
CREATE SEQUENCE IF NOT EXISTS prompts_short_id_seq START 10000;

-- 2. Add column
ALTER TABLE prompts 
ADD COLUMN IF NOT EXISTS short_id BIGINT;

-- 3. Set default value for future inserts
ALTER TABLE prompts 
ALTER COLUMN short_id SET DEFAULT nextval('prompts_short_id_seq');

-- 4. Backfill existing data
UPDATE prompts 
SET short_id = nextval('prompts_short_id_seq') 
WHERE short_id IS NULL;

-- 5. Add unique constraint
ALTER TABLE prompts 
ADD CONSTRAINT prompts_short_id_key UNIQUE (short_id);

-- 6. Index for performance
CREATE INDEX IF NOT EXISTS prompts_short_id_idx ON prompts (short_id);
