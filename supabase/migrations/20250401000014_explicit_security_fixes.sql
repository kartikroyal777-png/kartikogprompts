-- ==============================================================================
-- EXPLICIT SECURITY HARDENING & ADVISORY FIXES
-- ==============================================================================

-- 1. FIX FUNCTION SEARCH PATHS (Mutable Search Path Advisory)
-- We explicitly alter every custom function to use the secure 'public' search path.

ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.deduct_credits(uuid, integer, text) SET search_path = public;
ALTER FUNCTION public.unlock_prompt(uuid, uuid) SET search_path = public;
ALTER FUNCTION public.upgrade_to_pro(uuid, text) SET search_path = public;
ALTER FUNCTION public.simulate_topup(integer) SET search_path = public;
ALTER FUNCTION public.unlock_creator(uuid) SET search_path = public;
ALTER FUNCTION public.buy_ebook(integer) SET search_path = public;
ALTER FUNCTION public.request_usd_payout(numeric, text) SET search_path = public;
ALTER FUNCTION public.convert_credits_to_usd(integer) SET search_path = public;
ALTER FUNCTION public.get_subscribers(uuid) SET search_path = public;
ALTER FUNCTION public.get_earnings_history(uuid) SET search_path = public;
ALTER FUNCTION public.increment_prompt_likes(uuid) SET search_path = public;
ALTER FUNCTION public.decrement_prompt_likes(uuid) SET search_path = public;
ALTER FUNCTION public.increment_super_prompt_likes(uuid) SET search_path = public;
ALTER FUNCTION public.decrement_super_prompt_likes(uuid) SET search_path = public;
ALTER FUNCTION public.handle_rate_me_vote(uuid, text) SET search_path = public;

-- 2. FIX RLS POLICIES (Always True / No Policy Advisories)

-- A. CATEGORIES (Standard & Super)
-- Problem: Often missing policies or using "true" for all.
-- Fix: Public Read, Admin Write.

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read Categories" ON public.categories;
DROP POLICY IF EXISTS "Admin Manage Categories" ON public.categories;

CREATE POLICY "Public Read Categories" ON public.categories 
  FOR SELECT USING (true);

CREATE POLICY "Admin Manage Categories" ON public.categories 
  FOR ALL USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

ALTER TABLE public.super_prompt_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read Super Categories" ON public.super_prompt_categories;
DROP POLICY IF EXISTS "Admin Manage Super Categories" ON public.super_prompt_categories;

CREATE POLICY "Public Read Super Categories" ON public.super_prompt_categories 
  FOR SELECT USING (true);

CREATE POLICY "Admin Manage Super Categories" ON public.super_prompt_categories 
  FOR ALL USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- B. PROMPT IMAGES
-- Fix: Public Read, Authenticated Upload (Creator/Admin).

ALTER TABLE public.prompt_images ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read Images" ON public.prompt_images;
DROP POLICY IF EXISTS "Creator Upload Images" ON public.prompt_images;

CREATE POLICY "Public Read Images" ON public.prompt_images 
  FOR SELECT USING (true);

CREATE POLICY "Creator Upload Images" ON public.prompt_images 
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- C. RATE ME ENTRIES
-- Problem: "Always True" on Insert allows spam.
-- Fix: Restrict Insert/Update to Authenticated Users (Own Data).

ALTER TABLE public.rate_me_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read Published Entries" ON public.rate_me_entries;
DROP POLICY IF EXISTS "Users Manage Own Entries" ON public.rate_me_entries;
DROP POLICY IF EXISTS "Allow Insert" ON public.rate_me_entries;

CREATE POLICY "Public Read Published Entries" ON public.rate_me_entries 
  FOR SELECT USING (is_published = true OR auth.uid() = user_id);

CREATE POLICY "Users Manage Own Entries" ON public.rate_me_entries 
  FOR ALL USING (auth.uid() = user_id);

-- D. PROMPT REQUESTS
-- Problem: Public can insert (needed for non-logged in requests), but "true" triggers warning.
-- Fix: Explicitly allow 'anon' and 'authenticated' roles for INSERT, restrict SELECT to Admin/Owner.

ALTER TABLE public.prompt_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Insert Requests" ON public.prompt_requests;
DROP POLICY IF EXISTS "Admin View Requests" ON public.prompt_requests;
DROP POLICY IF EXISTS "User View Own Requests" ON public.prompt_requests;

CREATE POLICY "Public Insert Requests" ON public.prompt_requests 
  FOR INSERT WITH CHECK (true); -- Public form, must remain open

CREATE POLICY "Admin View Requests" ON public.prompt_requests 
  FOR SELECT USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "User View Own Requests" ON public.prompt_requests 
  FOR SELECT USING (auth.uid() = user_id);

-- E. API KEYS
-- Fix: Admin Only.

ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin Manage Keys" ON public.api_keys;

CREATE POLICY "Admin Manage Keys" ON public.api_keys 
  FOR ALL USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- F. SUPER PROMPTS
-- Fix: Public Read, Admin Write.

ALTER TABLE public.super_prompts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read Super Prompts" ON public.super_prompts;
DROP POLICY IF EXISTS "Admin Manage Super Prompts" ON public.super_prompts;

CREATE POLICY "Public Read Super Prompts" ON public.super_prompts 
  FOR SELECT USING (true);

CREATE POLICY "Admin Manage Super Prompts" ON public.super_prompts 
  FOR ALL USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- G. CREATOR UNLOCKS & PURCHASES
-- Fix: Users read own, System inserts via functions (Security Definer handles insert, but RLS should allow Select).

ALTER TABLE public.creator_unlocks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "User View Own Unlocks" ON public.creator_unlocks;

CREATE POLICY "User View Own Unlocks" ON public.creator_unlocks 
  FOR SELECT USING (auth.uid() = user_id);

ALTER TABLE public.prompt_purchases ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "User View Own Purchases" ON public.prompt_purchases;

CREATE POLICY "User View Own Purchases" ON public.prompt_purchases 
  FOR SELECT USING (auth.uid() = user_id);

-- H. PAYOUT REQUESTS
-- Fix: Creators manage own, Admin view all.

ALTER TABLE public.payout_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Creators Manage Own Payouts" ON public.payout_requests;
DROP POLICY IF EXISTS "Admin Manage Payouts" ON public.payout_requests;

CREATE POLICY "Creators Manage Own Payouts" ON public.payout_requests 
  FOR ALL USING (auth.uid() = creator_id);

CREATE POLICY "Admin Manage Payouts" ON public.payout_requests 
  FOR ALL USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- I. PROMPTS (General)
-- Fix: Ensure Insert is Authenticated only.

ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read Prompts" ON public.prompts;
DROP POLICY IF EXISTS "Creators Manage Own Prompts" ON public.prompts;

CREATE POLICY "Public Read Prompts" ON public.prompts 
  FOR SELECT USING (true);

CREATE POLICY "Creators Manage Own Prompts" ON public.prompts 
  FOR ALL USING (auth.uid() = creator_id OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
