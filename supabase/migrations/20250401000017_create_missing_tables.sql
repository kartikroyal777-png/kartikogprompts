/*
# Create Missing Tables
Creates the prompts, prompt_images, super_prompt_categories, and super_prompts tables.

## Query Description: 
This operation creates the core tables required for the application to function and reloads the schema cache. It uses IF NOT EXISTS to safely ensure the tables are present without overwriting existing data.

## Metadata:
- Schema-Category: Structural
- Impact-Level: Low
- Requires-Backup: false
- Reversible: true

## Structure Details:
Creates `prompts`, `prompt_images`, `super_prompt_categories`, and `super_prompts` tables.

## Security Implications:
- RLS Status: Disabled
- Policy Changes: No
- Auth Requirements: None

## Performance Impact:
- Indexes: Primary keys
- Triggers: None
- Estimated Impact: None
*/

-- Create prompts table
CREATE TABLE IF NOT EXISTS public.prompts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    prompt_type TEXT,
    image TEXT,
    category TEXT,
    categories TEXT[],
    is_published BOOLEAN DEFAULT false,
    short_id TEXT,
    credit_name TEXT,
    likes_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create prompt_images table for the one-to-many relationship
CREATE TABLE IF NOT EXISTS public.prompt_images (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    prompt_id UUID REFERENCES public.prompts(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create super_prompt_categories table
CREATE TABLE IF NOT EXISTS public.super_prompt_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create super_prompts table
CREATE TABLE IF NOT EXISTS public.super_prompts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    what_it_does TEXT,
    category_id UUID REFERENCES public.super_prompt_categories(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Force PostgREST to reload the schema cache so the API recognizes the new tables immediately
NOTIFY pgrst, 'reload schema';
