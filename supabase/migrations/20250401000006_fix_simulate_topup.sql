/*
  # Fix Simulate Topup Function
  
  Creates the missing simulate_topup function required for the Buy Credits page.
  
  ## Function Details:
  - Name: simulate_topup
  - Parameters: p_amount_credits (integer)
  - Purpose: Adds credits to the authenticated user's wallet
  - Security: SECURITY DEFINER (runs with admin privileges to update wallet), search_path=public
*/

CREATE OR REPLACE FUNCTION public.simulate_topup(p_amount_credits integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Get current user ID
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Update wallet (Insert if not exists, otherwise add to balance)
  INSERT INTO public.wallets (user_id, balance_credits, updated_at)
  VALUES (v_user_id, p_amount_credits, now())
  ON CONFLICT (user_id)
  DO UPDATE SET
    balance_credits = wallets.balance_credits + p_amount_credits,
    updated_at = now();
END;
$$;

-- Grant permission to authenticated users
GRANT EXECUTE ON FUNCTION public.simulate_topup(integer) TO authenticated;
