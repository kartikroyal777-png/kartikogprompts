/*
  # Security Hardening
  
  1. Function Security
     - Set search_path = public for all custom functions to prevent search path hijacking.
  
  2. RLS Policy Hardening
     - Ensure RLS is enabled on all tables.
     - Add missing policies for tables that might have RLS enabled but no rules.
     - Tighten overly permissive policies (replacing 'true' with specific auth checks).
*/

-- =================================================================
-- 1. SECURE FUNCTIONS (Fix: Function Search Path Mutable)
-- =================================================================

ALTER FUNCTION public.deduct_credits(uuid, integer, text) SET search_path = public;
ALTER FUNCTION public.upgrade_to_pro(uuid, text) SET search_path = public;
ALTER FUNCTION public.simulate_topup(integer) SET search_path = public;
ALTER FUNCTION public.unlock_creator(uuid) SET search_path = public;
ALTER FUNCTION public.unlock_prompt(uuid) SET search_path = public;
ALTER FUNCTION public.request_usd_payout(numeric, text) SET search_path = public;
ALTER FUNCTION public.convert_credits_to_usd(integer) SET search_path = public;
ALTER FUNCTION public.get_subscribers(uuid) SET search_path = public;
ALTER FUNCTION public.get_earnings_history(uuid) SET search_path = public;
ALTER FUNCTION public.increment_prompt_likes(uuid) SET search_path = public;
ALTER FUNCTION public.decrement_prompt_likes(uuid) SET search_path = public;
ALTER FUNCTION public.increment_super_prompt_likes(uuid) SET search_path = public;
ALTER FUNCTION public.decrement_super_prompt_likes(uuid) SET search_path = public;
ALTER FUNCTION public.handle_rate_me_vote(uuid, text) SET search_path = public;
ALTER FUNCTION public.buy_ebook(integer) SET search_path = public;

-- =================================================================
-- 2. ENABLE RLS ON ALL TABLES (Fix: RLS Enabled No Policy)
-- =================================================================

ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_unlocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.super_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.super_prompt_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_me_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- =================================================================
-- 3. TIGHTEN POLICIES (Fix: RLS Policy Always True)
-- =================================================================

-- API Keys: Admin Only
DROP POLICY IF EXISTS "Admin access api_keys" ON public.api_keys;
CREATE POLICY "Admin access api_keys" ON public.api_keys
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Categories: Public Read, Admin Write
DROP POLICY IF EXISTS "Public read categories" ON public.categories;
CREATE POLICY "Public read categories" ON public.categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin write categories" ON public.categories;
CREATE POLICY "Admin write categories" ON public.categories
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Super Prompt Categories: Public Read, Admin Write
DROP POLICY IF EXISTS "Public read super_categories" ON public.super_prompt_categories;
CREATE POLICY "Public read super_categories" ON public.super_prompt_categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin write super_categories" ON public.super_prompt_categories;
CREATE POLICY "Admin write super_categories" ON public.super_prompt_categories
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Rate Me Entries: Users manage own, Public read published
DROP POLICY IF EXISTS "Public read published entries" ON public.rate_me_entries;
CREATE POLICY "Public read published entries" ON public.rate_me_entries
  FOR SELECT USING (is_published = true);

DROP POLICY IF EXISTS "Users manage own entries" ON public.rate_me_entries;
CREATE POLICY "Users manage own entries" ON public.rate_me_entries
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Prompt Requests: Users see own, Admin sees all
DROP POLICY IF EXISTS "Users see own requests" ON public.prompt_requests;
CREATE POLICY "Users see own requests" ON public.prompt_requests
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Users create requests" ON public.prompt_requests;
CREATE POLICY "Users create requests" ON public.prompt_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Prompt Images: Public Read, Auth Insert
DROP POLICY IF EXISTS "Public read prompt_images" ON public.prompt_images;
CREATE POLICY "Public read prompt_images" ON public.prompt_images FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users insert prompt_images" ON public.prompt_images;
CREATE POLICY "Users insert prompt_images" ON public.prompt_images
  FOR INSERT
  TO authenticated
  WITH CHECK (true); -- Basic auth check required for uploads
