-- Enable RLS on categories if not already (safeguard)
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to ensure clean slate and avoid conflicts
DROP POLICY IF EXISTS "Enable read access for all users" ON public.categories;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.categories;
DROP POLICY IF EXISTS "Enable update for all users" ON public.categories;
DROP POLICY IF EXISTS "Enable delete for all users" ON public.categories;
DROP POLICY IF EXISTS "Allow public read access" ON public.categories;

-- Create comprehensive policies for categories
-- Note: In a production environment with strict auth, you might restrict write access to specific roles.
-- Given the current Admin.tsx client-side protection, we enable write access at the DB level.
CREATE POLICY "Enable read access for all users" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON public.categories FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON public.categories FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON public.categories FOR DELETE USING (true);

-- Repeat for super_prompt_categories to prevent similar errors there
ALTER TABLE public.super_prompt_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all users" ON public.super_prompt_categories;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.super_prompt_categories;
DROP POLICY IF EXISTS "Enable update for all users" ON public.super_prompt_categories;
DROP POLICY IF EXISTS "Enable delete for all users" ON public.super_prompt_categories;

CREATE POLICY "Enable read access for all users" ON public.super_prompt_categories FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON public.super_prompt_categories FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON public.super_prompt_categories FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON public.super_prompt_categories FOR DELETE USING (true);
