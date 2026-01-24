-- Add new columns for features
ALTER TABLE prompts ADD COLUMN IF NOT EXISTS video_prompt TEXT;
ALTER TABLE prompts ADD COLUMN IF NOT EXISTS input_image TEXT;
ALTER TABLE prompts ADD COLUMN IF NOT EXISTS outfit_link TEXT;

-- Add input images array for super prompts
ALTER TABLE super_prompts ADD COLUMN IF NOT EXISTS example_input_images TEXT[];

-- Add hierarchy to categories
ALTER TABLE categories ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES categories(id) ON DELETE SET NULL;

-- Security Fixes: Set search_path for all functions to prevent search path hijacking
-- Re-defining functions with proper security settings

CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger 
LANGUAGE plpgsql 
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, email)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url', new.email);
  
  INSERT INTO public.wallets (user_id, balance_credits)
  VALUES (new.id, 0);
  
  RETURN new;
END;
$$;

CREATE OR REPLACE FUNCTION public.deduct_credits(p_user_id uuid, p_amount integer, p_description text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  current_balance integer;
BEGIN
  SELECT balance_credits INTO current_balance FROM public.wallets WHERE user_id = p_user_id;
  
  IF current_balance >= p_amount THEN
    UPDATE public.wallets SET balance_credits = balance_credits - p_amount, updated_at = now() WHERE user_id = p_user_id;
    RETURN true;
  ELSE
    RETURN false;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_prompt_likes(p_prompt_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE public.prompts SET likes_count = likes_count + 1 WHERE id = p_prompt_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.decrement_prompt_likes(p_prompt_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE public.prompts SET likes_count = GREATEST(0, likes_count - 1) WHERE id = p_prompt_id;
END;
$$;

-- Ensure RLS is enabled on all tables
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Fix "RLS Enabled No Policy" warnings
DROP POLICY IF EXISTS "Public read access" ON categories;
CREATE POLICY "Public read access" ON categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin full access" ON categories;
CREATE POLICY "Admin full access" ON categories FOR ALL USING (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

DROP POLICY IF EXISTS "Public read prompt images" ON prompt_images;
CREATE POLICY "Public read prompt images" ON prompt_images FOR SELECT USING (true);

DROP POLICY IF EXISTS "Creators manage own images" ON prompt_images;
CREATE POLICY "Creators manage own images" ON prompt_images FOR ALL USING (
  exists (
    select 1 from prompts 
    where prompts.id = prompt_images.prompt_id 
    and prompts.creator_id = auth.uid()
  )
);
