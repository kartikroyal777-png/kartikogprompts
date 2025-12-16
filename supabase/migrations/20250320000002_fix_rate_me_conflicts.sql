/*
  # Fix Rate Me Policy Conflicts
  
  1. Changes
    - Add `player_name` column to `rate_me_entries` safely (if not exists).
    - Drop conflicting policy "Users can update their own entries" before recreating it.
    - Ensure RLS is enabled.
*/

-- Safely add player_name column
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rate_me_entries' AND column_name = 'player_name') THEN
        ALTER TABLE rate_me_entries ADD COLUMN player_name text;
    END IF;
END $$;

-- Fix Policy: Drop first to avoid "already exists" error
DROP POLICY IF EXISTS "Users can update their own entries" ON rate_me_entries;

-- Recreate the policy
CREATE POLICY "Users can update their own entries"
  ON rate_me_entries
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Ensure RLS is enabled
ALTER TABLE rate_me_entries ENABLE ROW LEVEL SECURITY;
