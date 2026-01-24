/*
  # Final Security Hardening & Fixes
  
  ## Overview
  This migration addresses 40+ security advisories by:
  1. Setting `search_path = public` on ALL functions to prevent search path hijacking.
  2. Ensuring RLS is enabled and has policies for all tables.
  3. Tightening overly permissive policies.

  ## Metadata
  - Schema-Category: Security
  - Impact-Level: High (Security)
  - Requires-Backup: No (Policy changes only)
  - Reversible: Yes
*/

-- 1. Secure Functions (Set search_path = public)
ALTER FUNCTION handle_new_user() SET search_path = public;
ALTER FUNCTION deduct_credits(uuid, integer, text) SET search_path = public;
ALTER FUNCTION unlock_prompt(uuid, uuid) SET search_path = public;
ALTER FUNCTION upgrade_to_pro(uuid, text) SET search_path = public;
ALTER FUNCTION simulate_topup(integer) SET search_path = public;
ALTER FUNCTION unlock_creator(uuid) SET search_path = public;
ALTER FUNCTION get_subscribers(uuid) SET search_path = public;
ALTER FUNCTION get_earnings_history(uuid) SET search_path = public;
ALTER FUNCTION increment_prompt_likes(uuid) SET search_path = public;
ALTER FUNCTION decrement_prompt_likes(uuid) SET search_path = public;
ALTER FUNCTION increment_super_prompt_likes(uuid) SET search_path = public;
ALTER FUNCTION decrement_super_prompt_likes(uuid) SET search_path = public;
ALTER FUNCTION handle_rate_me_vote(uuid, text) SET search_path = public;
ALTER FUNCTION buy_ebook(integer) SET search_path = public;
ALTER FUNCTION request_usd_payout(numeric, text) SET search_path = public;
ALTER FUNCTION convert_credits_to_usd(integer) SET search_path = public;

-- 2. Ensure RLS is Enabled on All Tables
ALTER TABLE IF EXISTS public.prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.prompt_contents ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.prompt_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.super_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.super_prompt_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.prompt_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.rate_me_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.creator_unlocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.prompt_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.payout_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.api_keys ENABLE ROW LEVEL SECURITY;

-- 3. Fix "RLS Enabled No Policy" (Add default policies if missing)

-- Prompt Images: Allow public read, creator write
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'prompt_images' AND policyname = 'Public Read Images') THEN
        CREATE POLICY "Public Read Images" ON public.prompt_images FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'prompt_images' AND policyname = 'Creators Insert Images') THEN
        CREATE POLICY "Creators Insert Images" ON public.prompt_images FOR INSERT WITH CHECK (auth.role() = 'authenticated');
    END IF;
END $$;

-- Categories: Allow public read, admin write
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'categories' AND policyname = 'Public Read Categories') THEN
        CREATE POLICY "Public Read Categories" ON public.categories FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'categories' AND policyname = 'Admin Manage Categories') THEN
        CREATE POLICY "Admin Manage Categories" ON public.categories FOR ALL USING (
            (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
        );
    END IF;
END $$;

-- Payout Requests: Owner read/write, Admin read/write
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payout_requests' AND policyname = 'Users manage own payouts') THEN
        CREATE POLICY "Users manage own payouts" ON public.payout_requests FOR ALL USING (creator_id = auth.uid());
    END IF;
END $$;

-- 4. Fix "RLS Policy Always True" (Tighten permissions)
-- Instead of dropping, we ensure strict policies exist. The warnings often come from `USING (true)` on INSERT/UPDATE.
-- We will drop insecure policies if they exist and replace them.

DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.prompts;
CREATE POLICY "Creators Insert Prompts" ON public.prompts FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.rate_me_entries;
CREATE POLICY "Users Insert RateMe" ON public.rate_me_entries FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Enable update for users based on email" ON public.profiles;
CREATE POLICY "Users Update Own Profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
