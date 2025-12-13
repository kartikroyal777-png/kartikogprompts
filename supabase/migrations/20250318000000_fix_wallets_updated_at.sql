-- Fix the missing column error in wallets table
ALTER TABLE wallets 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;

-- Update the buy_ebook function to work with the new schema
CREATE OR REPLACE FUNCTION buy_ebook(p_cost INTEGER)
RETURNS VOID AS $$
DECLARE
  v_user_id UUID;
  v_balance INTEGER;
BEGIN
  v_user_id := auth.uid();
  
  -- Check balance
  SELECT balance_credits INTO v_balance FROM wallets WHERE user_id = v_user_id;
  
  IF v_balance < p_cost THEN
    RAISE EXCEPTION 'Insufficient credits';
  END IF;

  -- Deduct credits and update timestamp
  UPDATE wallets 
  SET balance_credits = balance_credits - p_cost,
      updated_at = NOW()
  WHERE user_id = v_user_id;

  -- Grant ebook access
  UPDATE profiles
  SET ebook_access = true
  WHERE id = v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
