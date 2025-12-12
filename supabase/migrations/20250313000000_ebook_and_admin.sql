-- Create table for Ebook unlocks
CREATE TABLE IF NOT EXISTS public.ebook_unlocks (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id) NOT NULL,
    spent_credits numeric(10,1) NOT NULL,
    created_at timestamptz DEFAULT now(),
    UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.ebook_unlocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ebook unlock"
    ON public.ebook_unlocks FOR SELECT
    USING (auth.uid() = user_id);

-- Function to buy ebook
CREATE OR REPLACE FUNCTION public.buy_ebook(p_cost numeric)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_balance numeric;
BEGIN
    -- Check balance
    SELECT balance_credits INTO v_balance
    FROM public.wallets
    WHERE user_id = auth.uid();

    IF v_balance < p_cost THEN
        RAISE EXCEPTION 'Insufficient credits';
    END IF;

    -- Deduct credits
    UPDATE public.wallets
    SET balance_credits = balance_credits - p_cost
    WHERE user_id = auth.uid();

    -- Record ledger entry
    INSERT INTO public.wallet_ledger (user_id, delta_credits, reason, ref_id)
    VALUES (auth.uid(), -p_cost, 'buy_ebook', auth.uid());

    -- Record unlock
    INSERT INTO public.ebook_unlocks (user_id, spent_credits)
    VALUES (auth.uid(), p_cost);

    RETURN true;
END;
$$;

-- Function to assign admin role to specific email if it exists
DO $$
DECLARE
    v_user_id uuid;
BEGIN
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'kartikroyal777@gmail.com';
    
    IF v_user_id IS NOT NULL THEN
        -- Make admin and creator
        UPDATE public.profiles 
        SET role = 'admin', creator_badge = true, display_name = 'Admin'
        WHERE id = v_user_id;

        -- Create creator entry if not exists
        INSERT INTO public.creators (id, bio, full_access_price_credits)
        VALUES (v_user_id, 'Official OG Prompts Admin', 50)
        ON CONFLICT (id) DO NOTHING;

        -- Link existing prompts with no creator to this admin
        UPDATE public.prompts
        SET creator_id = v_user_id, credit_name = 'Admin'
        WHERE creator_id IS NULL;
    END IF;
END $$;
