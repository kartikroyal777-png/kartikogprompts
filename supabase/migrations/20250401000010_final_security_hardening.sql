-- Final Security Hardening Migration

-- 1. Fix Function Search Paths (prevents search_path hijacking)
-- We explicitly set the search_path to 'public' for all SECURITY DEFINER functions

ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.deduct_credits(uuid, integer, text) SET search_path = public;
ALTER FUNCTION public.unlock_prompt(uuid, uuid) SET search_path = public;
ALTER FUNCTION public.upgrade_to_pro(uuid, text) SET search_path = public;
ALTER FUNCTION public.simulate_topup(integer) SET search_path = public;

-- If these functions exist (from previous migrations), secure them too:
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'like_prompt') THEN
        ALTER FUNCTION public.like_prompt(uuid) SET search_path = public;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'unlike_prompt') THEN
        ALTER FUNCTION public.unlike_prompt(uuid) SET search_path = public;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'toggle_super_like') THEN
        ALTER FUNCTION public.toggle_super_like(uuid, integer) SET search_path = public;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'creator_unlock_prompt') THEN
        ALTER FUNCTION public.creator_unlock_prompt(uuid, uuid) SET search_path = public;
    END IF;
END $$;

-- 2. Fix RLS Policies (Add missing policies and tighten permissive ones)

-- Categories: Ensure it has policies (often flagged as RLS Enabled No Policy)
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    -- Drop existing permissive policies if they exist to replace them with strict ones
    DROP POLICY IF EXISTS "Allow public read access" ON public.categories;
    DROP POLICY IF EXISTS "Allow admin insert" ON public.categories;
    DROP POLICY IF EXISTS "Allow admin update" ON public.categories;
    DROP POLICY IF EXISTS "Allow admin delete" ON public.categories;
END $$;

CREATE POLICY "Allow public read access" ON public.categories FOR SELECT USING (true);

CREATE POLICY "Allow admin insert" ON public.categories FOR INSERT WITH CHECK (
  auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
);

CREATE POLICY "Allow admin update" ON public.categories FOR UPDATE USING (
  auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
);

CREATE POLICY "Allow admin delete" ON public.categories FOR DELETE USING (
  auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
);

-- Prompt Images: Tighten INSERT policy
ALTER TABLE public.prompt_images ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Public read access" ON public.prompt_images;
    DROP POLICY IF EXISTS "Creator insert images" ON public.prompt_images;
    DROP POLICY IF EXISTS "Users can upload images" ON public.prompt_images;
END $$;

CREATE POLICY "Public read access" ON public.prompt_images FOR SELECT USING (true);

-- Only authenticated users can upload images
CREATE POLICY "Authenticated users can upload images" ON public.prompt_images FOR INSERT WITH CHECK (
  auth.role() = 'authenticated'
);

-- Payout Requests: Ensure policies exist
ALTER TABLE public.payout_requests ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can view own requests" ON public.payout_requests;
    DROP POLICY IF EXISTS "Admins can view all requests" ON public.payout_requests;
    DROP POLICY IF EXISTS "Users can create requests" ON public.payout_requests;
END $$;

CREATE POLICY "Users can view own requests" ON public.payout_requests FOR SELECT USING (
  auth.uid() = user_id
);

CREATE POLICY "Admins can view all requests" ON public.payout_requests FOR SELECT USING (
  auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
);

CREATE POLICY "Users can create requests" ON public.payout_requests FOR INSERT WITH CHECK (
  auth.uid() = user_id
);

-- Prompt Requests: Ensure policies exist
ALTER TABLE public.prompt_requests ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Public read access" ON public.prompt_requests;
    DROP POLICY IF EXISTS "Users can create requests" ON public.prompt_requests;
END $$;

CREATE POLICY "Public read access" ON public.prompt_requests FOR SELECT USING (true);

CREATE POLICY "Users can create requests" ON public.prompt_requests FOR INSERT WITH CHECK (
  auth.uid() = user_id
);

-- Rate Me Entries: Tighten policies
ALTER TABLE public.rate_me_entries ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Anyone can view entries" ON public.rate_me_entries;
    DROP POLICY IF EXISTS "Users can create entries" ON public.rate_me_entries;
END $$;

CREATE POLICY "Anyone can view entries" ON public.rate_me_entries FOR SELECT USING (true);

CREATE POLICY "Users can create entries" ON public.rate_me_entries FOR INSERT WITH CHECK (
  auth.uid() = user_id
);
