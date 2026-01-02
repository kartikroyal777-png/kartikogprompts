-- Function to safely deduct credits from a user's wallet
-- Used for features like Image to JSON generation
CREATE OR REPLACE FUNCTION deduct_credits(amount int)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_balance int;
BEGIN
  -- Check if wallet exists and get balance
  SELECT balance_credits INTO current_balance
  FROM public.wallets
  WHERE user_id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Wallet not found';
  END IF;

  -- Check for sufficient funds
  IF current_balance < amount THEN
    RAISE EXCEPTION 'Insufficient credits';
  END IF;

  -- Deduct credits
  UPDATE public.wallets
  SET balance_credits = balance_credits - amount,
      updated_at = now()
  WHERE user_id = auth.uid();
END;
$$;
