-- Add ebook_access to profiles if not exists
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ebook_access boolean DEFAULT false;

-- Update buy_ebook to set ebook_access
CREATE OR REPLACE FUNCTION public.buy_ebook(p_cost integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_balance int;
BEGIN
  v_user_id := auth.uid();
  
  -- Check balance
  SELECT balance_credits INTO v_balance FROM public.wallets WHERE user_id = v_user_id;
  
  IF v_balance IS NULL OR v_balance < p_cost THEN
    RAISE EXCEPTION 'Insufficient credits';
  END IF;

  -- Deduct credits
  UPDATE public.wallets 
  SET balance_credits = balance_credits - p_cost,
      updated_at = now()
  WHERE user_id = v_user_id;

  -- Record transaction
  INSERT INTO public.wallet_ledger (user_id, amount, transaction_type, description)
  VALUES (v_user_id, -p_cost, 'debit', 'Purchased Ebook');

  -- Grant access
  UPDATE public.profiles
  SET ebook_access = true
  WHERE id = v_user_id;
END;
$$;

-- Function to get subscribers (users who unlocked this creator)
CREATE OR REPLACE FUNCTION public.get_subscribers(p_creator_id uuid)
RETURNS TABLE (
  user_id uuid,
  unlocked_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cu.user_id,
    cu.unlocked_at
  FROM public.creator_unlocks cu
  WHERE cu.creator_id = p_creator_id
  ORDER BY cu.unlocked_at DESC;
END;
$$;

-- Function to get earnings history (who sent credits via prompt purchases)
CREATE OR REPLACE FUNCTION public.get_earnings_history(p_creator_id uuid)
RETURNS TABLE (
  sender_id uuid,
  amount int,
  created_at timestamptz,
  prompt_title text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pp.user_id as sender_id,
    p.price_credits as amount,
    pp.purchased_at as created_at,
    p.title as prompt_title
  FROM public.prompt_purchases pp
  JOIN public.prompts p ON pp.prompt_id = p.id
  WHERE p.creator_id = p_creator_id
  ORDER BY pp.purchased_at DESC;
END;
$$;
