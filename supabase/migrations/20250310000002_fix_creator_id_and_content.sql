/* 
# Fix Credit System Schema
- Adds creator_id to prompts
- Ensures all credit system tables exist
- Sets up prompt_contents for secure text storage
*/

-- 1. Ensure creators table exists
CREATE TABLE IF NOT EXISTS public.creators (
    id UUID PRIMARY KEY REFERENCES public.profiles(id),
    bio TEXT,
    social_instagram TEXT,
    social_youtube TEXT,
    social_x TEXT,
    website TEXT,
    full_access_price_credits NUMERIC(10,1) DEFAULT 10.0,
    last_prompt_price_credits NUMERIC(10,1),
    payout_method TEXT,
    payout_details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.creators ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Creators are viewable by everyone" ON public.creators;
CREATE POLICY "Creators are viewable by everyone" ON public.creators FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can update own creator profile" ON public.creators;
CREATE POLICY "Users can update own creator profile" ON public.creators FOR UPDATE USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users can insert own creator profile" ON public.creators;
CREATE POLICY "Users can insert own creator profile" ON public.creators FOR INSERT WITH CHECK (auth.uid() = id);

-- 2. Add creator_id to prompts
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'prompts' AND column_name = 'creator_id') THEN
        ALTER TABLE public.prompts ADD COLUMN creator_id UUID REFERENCES public.creators(id);
    END IF;
END $$;

-- 3. Create prompt_contents for secure storage
CREATE TABLE IF NOT EXISTS public.prompt_contents (
    prompt_id UUID PRIMARY KEY REFERENCES public.prompts(id) ON DELETE CASCADE,
    full_text TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.prompt_contents ENABLE ROW LEVEL SECURITY;

-- 4. Create Wallet & Transaction Tables
CREATE TABLE IF NOT EXISTS public.wallets (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id),
    balance_credits NUMERIC(14,1) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own wallet" ON public.wallets;
CREATE POLICY "Users can view own wallet" ON public.wallets FOR SELECT USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.prompt_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id),
    prompt_id UUID REFERENCES public.prompts(id),
    spent_credits NUMERIC(14,1),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, prompt_id)
);
ALTER TABLE public.prompt_purchases ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own purchases" ON public.prompt_purchases;
CREATE POLICY "Users can view own purchases" ON public.prompt_purchases FOR SELECT USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.creator_unlocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id),
    creator_id UUID REFERENCES public.creators(id),
    spent_credits NUMERIC(14,1),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, creator_id)
);
ALTER TABLE public.creator_unlocks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own unlocks" ON public.creator_unlocks;
CREATE POLICY "Users can view own unlocks" ON public.creator_unlocks FOR SELECT USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.creator_earnings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID REFERENCES public.creators(id),
    from_user_id UUID REFERENCES public.profiles(id),
    source_type TEXT,
    source_id UUID,
    gross_credits NUMERIC(14,1),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.creator_earnings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Creators can view own earnings" ON public.creator_earnings;
CREATE POLICY "Creators can view own earnings" ON public.creator_earnings FOR SELECT USING (auth.uid() = creator_id);

-- 5. Helper Function for Access Control
CREATE OR REPLACE FUNCTION public.has_access_to_prompt(p_prompt_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_is_paid BOOLEAN;
    v_creator_id UUID;
    v_user_id UUID;
BEGIN
    v_user_id := auth.uid();
    
    SELECT is_paid, creator_id INTO v_is_paid, v_creator_id
    FROM public.prompts
    WHERE id = p_prompt_id;
    
    IF v_is_paid IS FALSE OR v_is_paid IS NULL THEN RETURN TRUE; END IF;
    IF v_creator_id = v_user_id THEN RETURN TRUE; END IF;
    IF EXISTS (SELECT 1 FROM public.prompt_purchases WHERE user_id = v_user_id AND prompt_id = p_prompt_id) THEN RETURN TRUE; END IF;
    IF EXISTS (SELECT 1 FROM public.creator_unlocks WHERE user_id = v_user_id AND creator_id = v_creator_id) THEN RETURN TRUE; END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Policy for prompt_contents
DROP POLICY IF EXISTS "Access prompt content" ON public.prompt_contents;
CREATE POLICY "Access prompt content" ON public.prompt_contents FOR SELECT USING (public.has_access_to_prompt(prompt_id));
GRANT SELECT ON public.prompt_contents TO authenticated;
GRANT SELECT ON public.prompt_contents TO anon;

-- 7. Unlock RPC
CREATE OR REPLACE FUNCTION public.unlock_prompt(p_prompt_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID;
    v_price NUMERIC;
    v_creator_id UUID;
    v_balance NUMERIC;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

    SELECT price_credits, creator_id INTO v_price, v_creator_id
    FROM public.prompts WHERE id = p_prompt_id;

    IF v_price IS NULL OR v_price <= 0 THEN RAISE EXCEPTION 'Prompt is free'; END IF;

    SELECT balance_credits INTO v_balance FROM public.wallets WHERE user_id = v_user_id;
    IF v_balance IS NULL OR v_balance < v_price THEN RAISE EXCEPTION 'Insufficient credits'; END IF;

    -- Transaction
    UPDATE public.wallets SET balance_credits = balance_credits - v_price WHERE user_id = v_user_id;
    INSERT INTO public.creator_earnings (creator_id, from_user_id, source_type, source_id, gross_credits)
    VALUES (v_creator_id, v_user_id, 'unlock_prompt', p_prompt_id, v_price);
    INSERT INTO public.prompt_purchases (user_id, prompt_id, spent_credits)
    VALUES (v_user_id, p_prompt_id, v_price);

    RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Simulate Topup RPC (For testing)
CREATE OR REPLACE FUNCTION public.simulate_topup(p_amount_credits NUMERIC)
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

    INSERT INTO public.wallets (user_id, balance_credits)
    VALUES (v_user_id, p_amount_credits)
    ON CONFLICT (user_id) DO UPDATE
    SET balance_credits = public.wallets.balance_credits + p_amount_credits;

    RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
