/*
  # Security Fixes & Hardening
  
  ## Query Description:
  This migration addresses security advisories by hardening function execution paths and ensuring RLS policies exist.
  1. Sets `search_path = public` for all custom functions to prevent search path hijacking.
  2. Ensures RLS policies exist for all tables.
  
  ## Metadata:
  - Schema-Category: "Security"
  - Impact-Level: "Low" (Configuration change only)
  - Requires-Backup: false
  - Reversible: true
  
  ## Security Implications:
  - Mitigates "Function Search Path Mutable" warnings.
  - Mitigates "RLS Enabled No Policy" warnings.
*/

-- 1. Fix Function Search Paths (Set to public to prevent hijacking)
ALTER FUNCTION public.deduct_credits(uuid, integer, text) SET search_path = public;
ALTER FUNCTION public.request_usd_payout(numeric, text) SET search_path = public;
ALTER FUNCTION public.unlock_creator(uuid) SET search_path = public;
ALTER FUNCTION public.unlock_prompt(uuid) SET search_path = public;
ALTER FUNCTION public.increment_prompt_likes(uuid) SET search_path = public;
ALTER FUNCTION public.decrement_prompt_likes(uuid) SET search_path = public;
ALTER FUNCTION public.increment_super_prompt_likes(uuid) SET search_path = public;
ALTER FUNCTION public.decrement_super_prompt_likes(uuid) SET search_path = public;
ALTER FUNCTION public.upgrade_to_pro(uuid, text) SET search_path = public;
ALTER FUNCTION public.simulate_topup(integer) SET search_path = public;
ALTER FUNCTION public.buy_ebook(integer) SET search_path = public;
ALTER FUNCTION public.convert_credits_to_usd(integer) SET search_path = public;
ALTER FUNCTION public.get_subscribers(uuid) SET search_path = public;
ALTER FUNCTION public.get_earnings_history(uuid) SET search_path = public;
ALTER FUNCTION public.handle_rate_me_vote(uuid, text) SET search_path = public;

-- 2. Ensure RLS Policies for Categories (if missing)
-- Categories are generally public read, admin write
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'categories' AND policyname = 'Public categories access'
    ) THEN
        CREATE POLICY "Public categories access" ON public.categories
            FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'categories' AND policyname = 'Admin manage categories'
    ) THEN
        CREATE POLICY "Admin manage categories" ON public.categories
            FOR ALL USING (
                exists (
                    select 1 from profiles
                    where profiles.id = auth.uid() and profiles.role = 'admin'
                )
            );
    END IF;
END
$$;

-- 3. Ensure RLS for Super Prompt Categories
ALTER TABLE public.super_prompt_categories ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'super_prompt_categories' AND policyname = 'Public super categories access'
    ) THEN
        CREATE POLICY "Public super categories access" ON public.super_prompt_categories
            FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'super_prompt_categories' AND policyname = 'Admin manage super categories'
    ) THEN
        CREATE POLICY "Admin manage super categories" ON public.super_prompt_categories
            FOR ALL USING (
                exists (
                    select 1 from profiles
                    where profiles.id = auth.uid() and profiles.role = 'admin'
                )
            );
    END IF;
END
$$;
