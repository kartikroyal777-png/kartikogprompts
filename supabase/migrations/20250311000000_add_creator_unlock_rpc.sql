-- Function to unlock a creator (Subscribe)
CREATE OR REPLACE FUNCTION unlock_creator(p_creator_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_cost NUMERIC;
  v_balance NUMERIC;
  v_creator_exists BOOLEAN;
  v_already_unlocked BOOLEAN;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Check if creator exists and get cost
  SELECT EXISTS(SELECT 1 FROM creators WHERE id = p_creator_id), full_access_price_credits
  INTO v_creator_exists, v_cost
  FROM creators
  WHERE id = p_creator_id;

  IF NOT v_creator_exists THEN
    RAISE EXCEPTION 'Creator not found';
  END IF;

  -- Check if already unlocked
  SELECT EXISTS(SELECT 1 FROM creator_unlocks WHERE user_id = v_user_id AND creator_id = p_creator_id)
  INTO v_already_unlocked;

  IF v_already_unlocked THEN
    RETURN jsonb_build_object('success', true, 'message', 'Already unlocked');
  END IF;

  -- Check balance
  SELECT balance_credits INTO v_balance FROM wallets WHERE user_id = v_user_id;
  
  IF v_balance < v_cost THEN
    RAISE EXCEPTION 'Insufficient credits';
  END IF;

  -- Perform Transaction
  -- 1. Deduct from user wallet
  UPDATE wallets 
  SET balance_credits = balance_credits - v_cost
  WHERE user_id = v_user_id;

  -- 2. Record ledger entry
  INSERT INTO wallet_ledger (user_id, delta_credits, reason, ref_id)
  VALUES (v_user_id, -v_cost, 'unlock_creator', p_creator_id);

  -- 3. Create unlock record
  INSERT INTO creator_unlocks (user_id, creator_id, spent_credits)
  VALUES (v_user_id, p_creator_id, v_cost);

  -- 4. Record creator earnings
  INSERT INTO creator_earnings (creator_id, from_user_id, source_type, source_id, gross_credits)
  VALUES (p_creator_id, v_user_id, 'unlock_creator', (SELECT id FROM creator_unlocks WHERE user_id = v_user_id AND creator_id = p_creator_id LIMIT 1), v_cost);

  RETURN jsonb_build_object('success', true, 'new_balance', v_balance - v_cost);
END;
$$;
