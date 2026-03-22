/*
  # Fix missing columns in categories and prompts
  
  ## Query Description:
  Adds missing columns to `categories`, `prompts`, `super_prompts`, and `super_prompt_categories` tables to match the frontend application's expected schema. Also creates `prompt_contents` if it doesn't exist.
  
  ## Metadata:
  - Schema-Category: Structural
  - Impact-Level: Low
  - Requires-Backup: false
  - Reversible: true
*/

-- Fix categories table
ALTER TABLE public.categories 
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'standard',
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.categories(id) ON DELETE CASCADE;

-- Fix prompts table
ALTER TABLE public.prompts
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS video_prompt TEXT,
ADD COLUMN IF NOT EXISTS creator_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS input_image TEXT,
ADD COLUMN IF NOT EXISTS monetization_url TEXT,
ADD COLUMN IF NOT EXISTS instagram_handle TEXT,
ADD COLUMN IF NOT EXISTS is_paid BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS price_credits INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_bundle BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS buy_look_links JSONB DEFAULT '[]'::jsonb;

-- Create prompt_contents table if missing
CREATE TABLE IF NOT EXISTS public.prompt_contents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    prompt_id UUID REFERENCES public.prompts(id) ON DELETE CASCADE,
    full_text TEXT,
    bundle_data JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Fix super_prompts table
ALTER TABLE public.super_prompts
ADD COLUMN IF NOT EXISTS prompt_content TEXT,
ADD COLUMN IF NOT EXISTS how_to_use TEXT,
ADD COLUMN IF NOT EXISTS example_output_images TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS example_input_images TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS thumbnail_image TEXT,
ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Fix super_prompt_categories table
ALTER TABLE public.super_prompt_categories
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS icon TEXT;

-- Reload schema cache so PostgREST picks up the new columns immediately
NOTIFY pgrst, 'reload schema';
