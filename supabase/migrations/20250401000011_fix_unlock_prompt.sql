-- Fix unlock_prompt function
-- This function handles the logic for unlocking a prompt:
-- 1. Checks if user has enough credits
-- 2. Deducts credits from buyer
-- 3. Adds credits to seller (creator)
-- 4. Records the unlock in unlocked_prompts table
-- 5. Records transactions in credit_ledger

CREATE OR REPLACE FUNCTION public.unlock_prompt(p_prompt_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_prompt_price integer;
  v_creator_id uuid;
  v_user_credits integer;
  v_prompt_title text;
BEGIN
  -- Get prompt details
  SELECT price, user_id, title INTO v_prompt_price, v_creator_id, v_prompt_title
  FROM prompts
  WHERE id = p_prompt_id;

  IF v_prompt_price IS NULL THEN
    RAISE EXCEPTION 'Prompt not found';
  END IF;

  -- Check if already unlocked
  IF EXISTS (SELECT 1 FROM unlocked_prompts WHERE user_id = p_user_id AND prompt_id = p_prompt_id) THEN
    RETURN true;
  END IF;

  -- Get user credits
  SELECT credits INTO v_user_credits
  FROM wallets
  WHERE user_id = p_user_id;

  -- Initialize wallet if not exists (safety check)
  IF v_user_credits IS NULL THEN
    INSERT INTO wallets (user_id, credits) VALUES (p_user_id, 0);
    v_user_credits := 0;
  END IF;

  IF v_user_credits < v_prompt_price THEN
    RAISE EXCEPTION 'Insufficient credits';
  END IF;

  -- Deduct from buyer
  UPDATE wallets
  SET credits = credits - v_prompt_price,
      updated_at = now()
  WHERE user_id = p_user_id;

  -- Add to seller
  UPDATE wallets
  SET credits = credits + v_prompt_price,
      updated_at = now()
  WHERE user_id = v_creator_id;

  -- Record unlock
  INSERT INTO unlocked_prompts (user_id, prompt_id)
  VALUES (p_user_id, p_prompt_id);

  -- Ledger: Debit Buyer
  INSERT INTO credit_ledger (user_id, amount, type, description)
  VALUES (p_user_id, -v_prompt_price, 'purchase', 'Unlocked prompt: ' || COALESCE(v_prompt_title, 'Unknown'));

  -- Ledger: Credit Seller
  INSERT INTO credit_ledger (user_id, amount, type, description)
  VALUES (v_creator_id, v_prompt_price, 'sale', 'Prompt unlocked: ' || COALESCE(v_prompt_title, 'Unknown'));

  RETURN true;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.unlock_prompt(uuid, uuid) TO authenticated;
