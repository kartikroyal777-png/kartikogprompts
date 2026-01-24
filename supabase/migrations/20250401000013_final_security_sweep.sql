-- Final Security Sweep to resolve all 31+ advisories

-- 1. SECURE ALL FUNCTIONS (Fixes "Function Search Path Mutable")
-- We explicitly set search_path to public for every function to prevent search_path hijacking.

ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.deduct_credits(uuid, integer, text) SET search_path = public;
ALTER FUNCTION public.unlock_prompt(uuid, uuid) SET search_path = public;
ALTER FUNCTION public.unlock_creator(uuid) SET search_path = public;
ALTER FUNCTION public.buy_ebook(integer) SET search_path = public;
ALTER FUNCTION public.upgrade_to_pro(uuid, text) SET search_path = public;
ALTER FUNCTION public.simulate_topup(integer) SET search_path = public;
ALTER FUNCTION public.convert_credits_to_usd(integer) SET search_path = public;
ALTER FUNCTION public.request_usd_payout(numeric, text) SET search_path = public;
ALTER FUNCTION public.get_subscribers(uuid) SET search_path = public;
ALTER FUNCTION public.get_earnings_history(uuid) SET search_path = public;
ALTER FUNCTION public.increment_prompt_likes(uuid) SET search_path = public;
ALTER FUNCTION public.decrement_prompt_likes(uuid) SET search_path = public;
ALTER FUNCTION public.increment_super_prompt_likes(uuid) SET search_path = public;
ALTER FUNCTION public.decrement_super_prompt_likes(uuid) SET search_path = public;
ALTER FUNCTION public.handle_rate_me_vote(uuid, text) SET search_path = public;

-- 2. TIGHTEN RLS POLICIES (Fixes "RLS Policy Always True" & "RLS Enabled No Policy")

-- PROMPTS TABLE
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.prompts;
CREATE POLICY "Enable insert for authenticated users only" ON public.prompts FOR INSERT TO authenticated WITH CHECK (auth.uid() = creator_id);

DROP POLICY IF EXISTS "Enable update for owners" ON public.prompts;
CREATE POLICY "Enable update for owners" ON public.prompts FOR UPDATE TO authenticated USING (auth.uid() = creator_id);

-- PROMPT IMAGES
ALTER TABLE public.prompt_images ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read access for prompt images" ON public.prompt_images;
CREATE POLICY "Public read access for prompt images" ON public.prompt_images FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated insert for prompt images" ON public.prompt_images;
CREATE POLICY "Authenticated insert for prompt images" ON public.prompt_images FOR INSERT TO authenticated WITH CHECK (true); 
-- Note: We allow auth users to upload images, linking is handled by app logic. Ideally strictly linked to prompt owner, but prompt_id might be null during upload flow.

-- CATEGORIES
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read categories" ON public.categories;
CREATE POLICY "Public read categories" ON public.categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin insert categories" ON public.categories;
CREATE POLICY "Admin insert categories" ON public.categories FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Admin update categories" ON public.categories;
CREATE POLICY "Admin update categories" ON public.categories FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Admin delete categories" ON public.categories;
CREATE POLICY "Admin delete categories" ON public.categories FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- SUPER PROMPT CATEGORIES
ALTER TABLE public.super_prompt_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read super categories" ON public.super_prompt_categories;
CREATE POLICY "Public read super categories" ON public.super_prompt_categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin manage super categories" ON public.super_prompt_categories;
CREATE POLICY "Admin manage super categories" ON public.super_prompt_categories FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- RATE ME ENTRIES
ALTER TABLE public.rate_me_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read published entries" ON public.rate_me_entries;
CREATE POLICY "Public read published entries" ON public.rate_me_entries FOR SELECT USING (is_published = true);

DROP POLICY IF EXISTS "Users can insert their own entries" ON public.rate_me_entries;
CREATE POLICY "Users can insert their own entries" ON public.rate_me_entries FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own entries" ON public.rate_me_entries;
CREATE POLICY "Users can update their own entries" ON public.rate_me_entries FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- PROMPT REQUESTS
ALTER TABLE public.prompt_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can insert requests" ON public.prompt_requests;
CREATE POLICY "Users can insert requests" ON public.prompt_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admin view all requests" ON public.prompt_requests;
CREATE POLICY "Admin view all requests" ON public.prompt_requests FOR SELECT TO authenticated USING (
  auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Admin update requests" ON public.prompt_requests;
CREATE POLICY "Admin update requests" ON public.prompt_requests FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- API KEYS (Strict Admin Only)
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin access api keys" ON public.api_keys;
CREATE POLICY "Admin access api keys" ON public.api_keys FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- PAYOUT REQUESTS
ALTER TABLE public.payout_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Creators insert payout requests" ON public.payout_requests;
CREATE POLICY "Creators insert payout requests" ON public.payout_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = creator_id);

DROP POLICY IF EXISTS "Creators view own requests" ON public.payout_requests;
CREATE POLICY "Creators view own requests" ON public.payout_requests FOR SELECT TO authenticated USING (auth.uid() = creator_id);

-- WALLETS
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view own wallet" ON public.wallets;
CREATE POLICY "Users view own wallet" ON public.wallets FOR SELECT TO authenticated USING (auth.uid() = user_id);
-- Note: Wallets should generally NOT be updatable by users directly via RLS, only via secure functions.
-- We intentionally DO NOT add an UPDATE policy for users here to prevent client-side balance hacking.
