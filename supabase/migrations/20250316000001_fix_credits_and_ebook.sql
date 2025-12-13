-- Add withdrawable_credits to wallets if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wallets' AND column_name = 'withdrawable_credits') THEN
        ALTER TABLE public.wallets ADD COLUMN withdrawable_credits numeric DEFAULT 0;
    END IF;
END $$;

-- Fix buy_ebook ambiguity by dropping potential variants and creating a single robust one
DROP FUNCTION IF EXISTS public.buy_ebook(integer);
DROP FUNCTION IF EXISTS public.buy_ebook(numeric);

CREATE OR REPLACE FUNCTION public.buy_ebook(p_cost integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_balance numeric;
BEGIN
  v_user_id := auth.uid();
  
  -- Check balance
  SELECT balance_credits INTO v_balance FROM public.wallets WHERE user_id = v_user_id;
  
  IF v_balance IS NULL OR v_balance < p_cost THEN
    RAISE EXCEPTION 'Insufficient credits';
  END IF;

  -- Deduct credits
  -- We reduce withdrawable credits only if the new total balance falls below the current withdrawable amount
  -- (Spending logic: Spend purchased credits first, then earned credits)
  UPDATE public.wallets
  SET balance_credits = balance_credits - p_cost,
      withdrawable_credits = LEAST(withdrawable_credits, balance_credits - p_cost)
  WHERE user_id = v_user_id;

  -- Record unlock
  INSERT INTO public.ebook_unlocks (user_id, unlocked_at)
  VALUES (v_user_id, now())
  ON CONFLICT (user_id) DO NOTHING;

  -- Add to ledger if table exists
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'wallet_ledger') THEN
    INSERT INTO public.wallet_ledger (user_id, amount, transaction_type, description)
    VALUES (v_user_id, -p_cost, 'purchase', 'Ebook Purchase');
  END IF;
END;
$$;

-- Update unlock_prompt to correctly distribute credits to creators
CREATE OR REPLACE FUNCTION public.unlock_prompt(p_prompt_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_creator_id uuid;
  v_price numeric;
  v_buyer_balance numeric;
BEGIN
  v_user_id := auth.uid();
  
  -- Get prompt details
  SELECT creator_id, price_credits INTO v_creator_id, v_price
  FROM public.prompts
  WHERE id = p_prompt_id;
  
  IF v_price IS NULL OR v_price <= 0 THEN
    RETURN; -- Free prompt, nothing to do
  END IF;

  -- Check buyer balance
  SELECT balance_credits INTO v_buyer_balance
  FROM public.wallets
  WHERE user_id = v_user_id;
  
  IF v_buyer_balance IS NULL OR v_buyer_balance < v_price THEN
    RAISE EXCEPTION 'Insufficient credits';
  END IF;

  -- 1. Deduct from buyer
  UPDATE public.wallets
  SET balance_credits = balance_credits - v_price,
      withdrawable_credits = LEAST(withdrawable_credits, balance_credits - v_price)
  WHERE user_id = v_user_id;

  -- 2. Add to creator (Increase both Total and Withdrawable)
  IF v_creator_id IS NOT NULL THEN
    UPDATE public.wallets
    SET balance_credits = balance_credits + v_price,
        withdrawable_credits = withdrawable_credits + v_price
    WHERE user_id = v_creator_id;
    
    -- Record earnings if table exists
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'creator_earnings') THEN
       INSERT INTO public.creator_earnings (creator_id, gross_credits, source_type, source_id)
       VALUES (v_creator_id, v_price, 'prompt_sale', p_prompt_id);
    END IF;
  END IF;

  -- 3. Record purchase
  INSERT INTO public.prompt_purchases (user_id, prompt_id, price_paid)
  VALUES (v_user_id, p_prompt_id, v_price);

END;
$$;
