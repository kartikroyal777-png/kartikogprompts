-- Ensure the simulate_topup function exists with the correct signature and security settings
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

  -- Insert or Update wallet
  INSERT INTO public.wallets (user_id, balance_credits, updated_at)
  VALUES (v_user_id, p_amount_credits, now())
  ON CONFLICT (user_id)
  DO UPDATE SET
    balance_credits = wallets.balance_credits + p_amount_credits,
    updated_at = now();
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.simulate_topup(integer) TO authenticated;
