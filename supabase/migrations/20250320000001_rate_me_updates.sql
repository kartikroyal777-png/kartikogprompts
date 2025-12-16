-- Add player_name to rate_me_entries for custom leaderboard names
ALTER TABLE rate_me_entries 
ADD COLUMN IF NOT EXISTS player_name text;

-- Policy update to allow users to update their own entries (if needed later)
CREATE POLICY "Users can update their own entries" 
ON rate_me_entries FOR UPDATE 
USING (auth.uid() = user_id);
