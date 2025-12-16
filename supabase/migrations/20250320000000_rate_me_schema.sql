-- Create Rate Me Entries Table
CREATE TABLE IF NOT EXISTS rate_me_entries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  gender TEXT CHECK (gender IN ('Men', 'Women')),
  parameters JSONB NOT NULL, -- Stores { face, outfit, eyes, jawline, skin, overall }
  ai_base_score NUMERIC(10, 3) NOT NULL,
  vote_offset NUMERIC(10, 3) DEFAULT 0.000,
  final_score NUMERIC(10, 3) GENERATED ALWAYS AS (ai_base_score + vote_offset) STORED,
  is_published BOOLEAN DEFAULT FALSE,
  social_links JSONB DEFAULT '{"instagram": "", "twitter": "", "youtube": ""}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one published entry per user per gender (optional, or just one total)
  CONSTRAINT one_published_entry_per_user UNIQUE (user_id, is_published)
);

-- Create Votes Table
CREATE TABLE IF NOT EXISTS rate_me_votes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  voter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_id UUID REFERENCES rate_me_entries(id) ON DELETE CASCADE,
  vote_type TEXT CHECK (vote_type IN ('UP', 'DOWN')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(voter_id, entry_id) -- Prevent double voting
);

-- RLS Policies
ALTER TABLE rate_me_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_me_votes ENABLE ROW LEVEL SECURITY;

-- Entries Policies
CREATE POLICY "Public entries are viewable by everyone" 
ON rate_me_entries FOR SELECT 
USING (is_published = true OR auth.uid() = user_id);

CREATE POLICY "Users can insert their own entries" 
ON rate_me_entries FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own entries" 
ON rate_me_entries FOR UPDATE 
USING (auth.uid() = user_id);

-- Votes Policies
CREATE POLICY "Votes are viewable by everyone" 
ON rate_me_votes FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can vote" 
ON rate_me_votes FOR INSERT 
WITH CHECK (auth.uid() = voter_id);

CREATE POLICY "Users can update their own votes" 
ON rate_me_votes FOR UPDATE 
USING (auth.uid() = voter_id);

-- Function to handle voting logic atomically
CREATE OR REPLACE FUNCTION handle_rate_me_vote(
  p_entry_id UUID,
  p_vote_type TEXT
) RETURNS VOID AS $$
DECLARE
  v_existing_vote TEXT;
  v_vote_val NUMERIC;
BEGIN
  -- Check if user has already voted
  SELECT vote_type INTO v_existing_vote
  FROM rate_me_votes
  WHERE entry_id = p_entry_id AND voter_id = auth.uid();

  IF v_existing_vote IS NULL THEN
    -- New Vote
    INSERT INTO rate_me_votes (voter_id, entry_id, vote_type)
    VALUES (auth.uid(), p_entry_id, p_vote_type);

    -- Update Score
    UPDATE rate_me_entries
    SET vote_offset = vote_offset + CASE WHEN p_vote_type = 'UP' THEN 0.01 ELSE -0.01 END
    WHERE id = p_entry_id;

  ELSIF v_existing_vote != p_vote_type THEN
    -- Change Vote (e.g., UP to DOWN)
    UPDATE rate_me_votes
    SET vote_type = p_vote_type
    WHERE entry_id = p_entry_id AND voter_id = auth.uid();

    -- Update Score (Reverse previous, apply new)
    -- If was UP (+0.01) and now DOWN (-0.01), we need -0.02 total change
    UPDATE rate_me_entries
    SET vote_offset = vote_offset + CASE WHEN p_vote_type = 'UP' THEN 0.02 ELSE -0.02 END
    WHERE id = p_entry_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
