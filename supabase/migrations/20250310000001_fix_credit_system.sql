-- Fix Credit System Schema
-- This migration safely adds columns and tables for the credit system

-- 1. Safely add columns to profiles
DO $$
BEGIN
    -- Add role if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'role') THEN
        ALTER TABLE profiles ADD COLUMN role text DEFAULT 'user';
    END IF;

    -- Add pro/creator flags
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'is_pro') THEN
        ALTER TABLE profiles ADD COLUMN is_pro boolean DEFAULT false;
        ALTER TABLE profiles ADD COLUMN pro_badge boolean DEFAULT false;
        ALTER TABLE profiles ADD COLUMN pro_since timestamptz;
        ALTER TABLE profiles ADD COLUMN creator_badge boolean DEFAULT false;
    END IF;
END $$;

-- 2. Create Creators Table
CREATE TABLE IF NOT EXISTS creators (
    id uuid PRIMARY KEY REFERENCES profiles(id),
    bio text,
    social_instagram text,
    social_youtube text,
    social_x text,
    website text,
    full_access_price_credits numeric(10,1) DEFAULT 10.0,
    last_prompt_price_credits numeric(10,1),
    payout_method text,
    payout_details jsonb,
    created_at timestamptz DEFAULT now()
);

-- 3. Create Wallets & Ledger
CREATE TABLE IF NOT EXISTS wallets (
    user_id uuid PRIMARY KEY REFERENCES profiles(id),
    balance_credits numeric(14,1) DEFAULT 0
);

CREATE TABLE IF NOT EXISTS wallet_ledger (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES profiles(id),
    delta_credits numeric(14,1),
    reason text,
    ref_id uuid,
    created_at timestamptz DEFAULT now()
);

-- 4. Create Unlocks & Purchases
CREATE TABLE IF NOT EXISTS creator_unlocks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES profiles(id),
    creator_id uuid REFERENCES creators(id),
    spent_credits numeric(14,1),
    created_at timestamptz DEFAULT now(),
    UNIQUE(user_id, creator_id)
);

CREATE TABLE IF NOT EXISTS prompt_purchases (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES profiles(id),
    prompt_id uuid REFERENCES prompts(id),
    spent_credits numeric(14,1),
    created_at timestamptz DEFAULT now(),
    UNIQUE(user_id, prompt_id)
);

CREATE TABLE IF NOT EXISTS creator_earnings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id uuid REFERENCES creators(id),
    from_user_id uuid REFERENCES profiles(id),
    source_type text,
    source_id uuid,
    gross_credits numeric(14,1),
    created_at timestamptz DEFAULT now()
);

-- 5. Update Prompts Table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'prompts' AND column_name = 'is_paid') THEN
        ALTER TABLE prompts ADD COLUMN is_paid boolean DEFAULT false;
        ALTER TABLE prompts ADD COLUMN price_credits numeric(10,1);
        ALTER TABLE prompts ADD COLUMN preview_text text;
    END IF;
END $$;

-- 6. Secure Content Table (to hide full text of premium prompts)
CREATE TABLE IF NOT EXISTS prompt_contents (
    prompt_id uuid PRIMARY KEY REFERENCES prompts(id) ON DELETE CASCADE,
    full_text text,
    created_at timestamptz DEFAULT now()
);

-- Migrate existing description to preview_text and prompt_contents if needed
-- (This is a one-time data fix)
INSERT INTO prompt_contents (prompt_id, full_text)
SELECT id, description FROM prompts
ON CONFLICT (prompt_id) DO NOTHING;

-- 7. RLS Policies

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_unlocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_contents ENABLE ROW LEVEL SECURITY;

-- Profiles: Public read, Owner update
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Creators: Public read, Owner update
DROP POLICY IF EXISTS "Creators public read" ON creators;
CREATE POLICY "Creators public read" ON creators FOR SELECT USING (true);
DROP POLICY IF EXISTS "Creators update own" ON creators;
CREATE POLICY "Creators update own" ON creators FOR UPDATE USING (auth.uid() = id);
DROP POLICY IF EXISTS "Creators insert own" ON creators;
CREATE POLICY "Creators insert own" ON creators FOR INSERT WITH CHECK (auth.uid() = id);

-- Wallets: Owner read only
DROP POLICY IF EXISTS "Wallets owner read" ON wallets;
CREATE POLICY "Wallets owner read" ON wallets FOR SELECT USING (auth.uid() = user_id);

-- Prompt Contents: Secure Access Logic
DROP POLICY IF EXISTS "Secure prompt content access" ON prompt_contents;
CREATE POLICY "Secure prompt content access" ON prompt_contents FOR SELECT USING (
    -- 1. Creator can always see own content
    (EXISTS (SELECT 1 FROM prompts WHERE id = prompt_contents.prompt_id AND creator_id = auth.uid()))
    OR
    -- 2. If prompt is NOT paid, everyone can see
    (EXISTS (SELECT 1 FROM prompts WHERE id = prompt_contents.prompt_id AND is_paid = false))
    OR
    -- 3. If user bought the prompt
    (EXISTS (SELECT 1 FROM prompt_purchases WHERE prompt_id = prompt_contents.prompt_id AND user_id = auth.uid()))
    OR
    -- 4. If user unlocked the creator
    (EXISTS (SELECT 1 FROM creator_unlocks WHERE creator_id = (SELECT creator_id FROM prompts WHERE id = prompt_contents.prompt_id) AND user_id = auth.uid()))
);

-- Prompt Contents: Creator Insert/Update
DROP POLICY IF EXISTS "Creator manage content" ON prompt_contents;
CREATE POLICY "Creator manage content" ON prompt_contents FOR ALL USING (
    EXISTS (SELECT 1 FROM prompts WHERE id = prompt_contents.prompt_id AND creator_id = auth.uid())
);

-- 8. Functions

-- Function to unlock a prompt
CREATE OR REPLACE FUNCTION unlock_prompt(p_prompt_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id uuid;
    v_price numeric;
    v_creator_id uuid;
    v_balance numeric;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

    -- Get prompt details
    SELECT price_credits, creator_id INTO v_price, v_creator_id
    FROM prompts WHERE id = p_prompt_id;

    IF v_price IS NULL OR v_price <= 0 THEN RAISE EXCEPTION 'Prompt is free or invalid'; END IF;

    -- Check balance
    SELECT balance_credits INTO v_balance FROM wallets WHERE user_id = v_user_id;
    IF v_balance IS NULL OR v_balance < v_price THEN
        RAISE EXCEPTION 'Insufficient credits';
    END IF;

    -- Check if already unlocked
    IF EXISTS (SELECT 1 FROM prompt_purchases WHERE user_id = v_user_id AND prompt_id = p_prompt_id) THEN
        RETURN jsonb_build_object('success', true, 'message', 'Already unlocked');
    END IF;

    -- Deduct credits
    UPDATE wallets SET balance_credits = balance_credits - v_price WHERE user_id = v_user_id;

    -- Add ledger entry
    INSERT INTO wallet_ledger (user_id, delta_credits, reason, ref_id)
    VALUES (v_user_id, -v_price, 'unlock_prompt', p_prompt_id);

    -- Record purchase
    INSERT INTO prompt_purchases (user_id, prompt_id, spent_credits)
    VALUES (v_user_id, p_prompt_id, v_price);

    -- Credit creator
    INSERT INTO creator_earnings (creator_id, from_user_id, source_type, source_id, gross_credits)
    VALUES (v_creator_id, v_user_id, 'unlock_prompt', p_prompt_id, v_price);

    RETURN jsonb_build_object('success', true, 'new_balance', v_balance - v_price);
END;
$$;

-- Function to simulate topup (For MVP)
CREATE OR REPLACE FUNCTION simulate_topup(p_amount_credits numeric)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id uuid;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

    -- Create wallet if not exists
    INSERT INTO wallets (user_id, balance_credits) VALUES (v_user_id, 0)
    ON CONFLICT (user_id) DO NOTHING;

    -- Add credits
    UPDATE wallets SET balance_credits = balance_credits + p_amount_credits WHERE user_id = v_user_id;

    -- Ledger
    INSERT INTO wallet_ledger (user_id, delta_credits, reason)
    VALUES (v_user_id, p_amount_credits, 'topup');

    -- Update pro status
    UPDATE profiles SET is_pro = true, pro_badge = true, pro_since = now()
    WHERE id = v_user_id AND is_pro = false;

    RETURN jsonb_build_object('success', true);
END;
$$;
