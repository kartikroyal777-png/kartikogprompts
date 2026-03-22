/*
  # Retry Missing Columns & Tables
  Transient timeouts can happen when the database is waking up.
  This migration safely ensures all required tables and columns exist.
*/

-- Ensure categories table exists
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT DEFAULT 'standard',
    parent_id UUID REFERENCES public.categories(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure columns on categories
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'standard';
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.categories(id);

-- Ensure prompts table and columns
CREATE TABLE IF NOT EXISTS public.prompts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.prompts ADD COLUMN IF NOT EXISTS prompt_type TEXT DEFAULT 'standard';
ALTER TABLE public.prompts ADD COLUMN IF NOT EXISTS is_bundle BOOLEAN DEFAULT false;
ALTER TABLE public.prompts ADD COLUMN IF NOT EXISTS price_credits INTEGER DEFAULT 0;
ALTER TABLE public.prompts ADD COLUMN IF NOT EXISTS is_paid BOOLEAN DEFAULT false;
ALTER TABLE public.prompts ADD COLUMN IF NOT EXISTS monetization_url TEXT;
ALTER TABLE public.prompts ADD COLUMN IF NOT EXISTS instagram_handle TEXT;
ALTER TABLE public.prompts ADD COLUMN IF NOT EXISTS buy_look_links JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.prompts ADD COLUMN IF NOT EXISTS input_image TEXT;
ALTER TABLE public.prompts ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.prompts ADD COLUMN IF NOT EXISTS video_prompt TEXT;
ALTER TABLE public.prompts ADD COLUMN IF NOT EXISTS creator_id UUID;
ALTER TABLE public.prompts ADD COLUMN IF NOT EXISTS image TEXT;
ALTER TABLE public.prompts ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.prompts ADD COLUMN IF NOT EXISTS categories TEXT[];
ALTER TABLE public.prompts ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false;
ALTER TABLE public.prompts ADD COLUMN IF NOT EXISTS short_id TEXT;
ALTER TABLE public.prompts ADD COLUMN IF NOT EXISTS credit_name TEXT;
ALTER TABLE public.prompts ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;

-- Ensure prompt_contents
CREATE TABLE IF NOT EXISTS public.prompt_contents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    prompt_id UUID REFERENCES public.prompts(id) ON DELETE CASCADE,
    full_text TEXT,
    bundle_data JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure super_prompt_categories
CREATE TABLE IF NOT EXISTS public.super_prompt_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.super_prompt_categories ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.super_prompt_categories ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
ALTER TABLE public.super_prompt_categories ADD COLUMN IF NOT EXISTS icon TEXT;

-- Ensure super_prompts
CREATE TABLE IF NOT EXISTS public.super_prompts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    what_it_does TEXT,
    category_id UUID REFERENCES public.super_prompt_categories(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.super_prompts ADD COLUMN IF NOT EXISTS prompt_content TEXT;
ALTER TABLE public.super_prompts ADD COLUMN IF NOT EXISTS how_to_use TEXT;
ALTER TABLE public.super_prompts ADD COLUMN IF NOT EXISTS example_output_images TEXT[] DEFAULT '{}';
ALTER TABLE public.super_prompts ADD COLUMN IF NOT EXISTS example_input_images TEXT[] DEFAULT '{}';
ALTER TABLE public.super_prompts ADD COLUMN IF NOT EXISTS thumbnail_image TEXT;
ALTER TABLE public.super_prompts ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT false;
ALTER TABLE public.super_prompts ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;
ALTER TABLE public.super_prompts ADD COLUMN IF NOT EXISTS created_by UUID;

NOTIFY pgrst, 'reload schema';
