-- Drop existing functions to avoid return type conflicts
DROP FUNCTION IF EXISTS public.unlock_prompt(uuid);
DROP FUNCTION IF EXISTS public.buy_ebook(integer);
DROP FUNCTION IF EXISTS public.buy_ebook(numeric);

-- Create wallet_ledger table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.wallet_ledger (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    wallet_id uuid REFERENCES public.wallets(id) ON DELETE CASCADE NOT NULL,
    amount numeric NOT NULL,
    transaction_type text NOT NULL CHECK (transaction_type IN ('deposit', 'withdrawal', 'purchase', 'earning', 'refund')),
    description text,
    created_at timestamptz DEFAULT now()
);

-- Enable RLS on ledger
ALTER TABLE public.wallet_ledger ENABLE ROW LEVEL SECURITY;

-- Policy for ledger
DROP POLICY IF EXISTS "Users can view own ledger" ON public.wallet_ledger;
CREATE POLICY "Users can view own ledger" ON public.wallet_ledger
  FOR SELECT USING (
    exists (
      select 1 from public.wallets
      where wallets.id = wallet_ledger.wallet_id
      and wallets.user_id = auth.uid()
    )
  );

-- Add withdrawable_credits to wallets if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'wallets' AND column_name = 'withdrawable_credits') THEN
        ALTER TABLE public.wallets ADD COLUMN withdrawable_credits numeric DEFAULT 0;
    END IF;
END $$;

-- Recreate buy_ebook function
CREATE OR REPLACE FUNCTION public.buy_ebook(p_cost integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_wallet_id uuid;
  v_balance numeric;
BEGIN
  v_user_id := auth.uid();
  
  -- Get user's wallet
  SELECT id, balance INTO v_wallet_id, v_balance
  FROM public.wallets
  WHERE user_id = v_user_id;
  
  IF v_wallet_id IS NULL THEN
    RAISE EXCEPTION 'Wallet not found';
  END IF;
  
  IF v_balance < p_cost THEN
    RAISE EXCEPTION 'Insufficient funds';
  END IF;
  
  -- Deduct from balance
  UPDATE public.wallets
  SET balance = balance - p_cost,
      updated_at = now()
  WHERE id = v_wallet_id;
  
  -- Record transaction
  INSERT INTO public.wallet_ledger (wallet_id, amount, transaction_type, description)
  VALUES (v_wallet_id, -p_cost, 'purchase', 'Ebook Purchase');
  
  RETURN true;
END;
$$;

-- Recreate unlock_prompt function
CREATE OR REPLACE FUNCTION public.unlock_prompt(p_prompt_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_wallet_id uuid;
  v_creator_wallet_id uuid;
  v_balance numeric;
  v_price integer;
  v_creator_id uuid;
BEGIN
  v_user_id := auth.uid();
  
  -- Get prompt details
  SELECT price, creator_id INTO v_price, v_creator_id
  FROM public.prompts
  WHERE id = p_prompt_id;
  
  IF v_price IS NULL THEN
    RAISE EXCEPTION 'Prompt not found';
  END IF;
  
  -- Check if already unlocked
  IF EXISTS (SELECT 1 FROM public.prompt_unlocks WHERE user_id = v_user_id AND prompt_id = p_prompt_id) THEN
    RETURN true;
  END IF;
  
  -- Get buyer's wallet
  SELECT id, balance INTO v_wallet_id, v_balance
  FROM public.wallets
  WHERE user_id = v_user_id;
  
  IF v_wallet_id IS NULL THEN
    RAISE EXCEPTION 'Wallet not found';
  END IF;
  
  IF v_balance < v_price THEN
    RAISE EXCEPTION 'Insufficient funds';
  END IF;
  
  -- Deduct from buyer
  UPDATE public.wallets
  SET balance = balance - v_price,
      updated_at = now()
  WHERE id = v_wallet_id;
  
  -- Record buyer transaction
  INSERT INTO public.wallet_ledger (wallet_id, amount, transaction_type, description)
  VALUES (v_wallet_id, -v_price, 'purchase', 'Unlocked prompt ' || p_prompt_id);
  
  -- Credit creator
  -- Get creator's wallet
  SELECT id INTO v_creator_wallet_id
  FROM public.wallets
  WHERE user_id = v_creator_id;
  
  IF v_creator_wallet_id IS NOT NULL THEN
    -- Add to balance AND withdrawable_credits
    UPDATE public.wallets
    SET balance = balance + v_price,
        withdrawable_credits = COALESCE(withdrawable_credits, 0) + v_price,
        updated_at = now()
    WHERE id = v_creator_wallet_id;
    
    -- Record creator transaction
    INSERT INTO public.wallet_ledger (wallet_id, amount, transaction_type, description)
    VALUES (v_creator_wallet_id, v_price, 'earning', 'Sale of prompt ' || p_prompt_id);
  END IF;
  
  -- Record unlock
  INSERT INTO public.prompt_unlocks (user_id, prompt_id, price_paid)
  VALUES (v_user_id, p_prompt_id, v_price);
  
  RETURN true;
END;
$$;
