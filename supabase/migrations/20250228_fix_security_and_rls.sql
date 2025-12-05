/*
  # Fix Security, RLS, and Triggers
  
  ## Query Description:
  1. Enables Row Level Security (RLS) on all tables.
  2. Drops existing policies to prevent conflicts, then recreates them.
  3. Secures functions with `search_path`.
  4. Sets up automatic profile creation on user signup.

  ## Metadata:
  - Schema-Category: "Safe"
  - Impact-Level: "Medium"
  - Requires-Backup: false
  - Reversible: true
*/

-- 1. Secure Functions (Fix Search Path Advisory)
CREATE OR REPLACE FUNCTION public.prompts_tsv_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
begin
  new.searchable_tsv :=
    setweight(to_tsvector('english', coalesce(new.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(new.description, '')), 'B');
  return new;
end;
$$;

-- 2. Profile Creation Trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
begin
  INSERT INTO public.profiles (id, full_name, created_at)
  VALUES (new.id, COALESCE(new.raw_user_meta_data->>'full_name', 'User'), now());
  RETURN new;
end;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 3. Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ebook_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE ebooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- 4. Policies (Drop first to avoid 42710 error)

-- PROFILES
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON profiles;
CREATE POLICY "Public profiles are viewable by everyone." ON profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile." ON profiles;
CREATE POLICY "Users can update own profile." ON profiles FOR UPDATE USING (auth.uid() = id);

-- PROMPTS
DROP POLICY IF EXISTS "Public prompts are viewable by everyone." ON prompts;
CREATE POLICY "Public prompts are viewable by everyone." ON prompts FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own prompts." ON prompts;
CREATE POLICY "Users can insert their own prompts." ON prompts FOR INSERT WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "Users can update their own prompts." ON prompts;
CREATE POLICY "Users can update their own prompts." ON prompts FOR UPDATE USING (auth.uid() = author_id);

-- PROMPT IMAGES
DROP POLICY IF EXISTS "Public images are viewable by everyone." ON prompt_images;
CREATE POLICY "Public images are viewable by everyone." ON prompt_images FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert images for their prompts." ON prompt_images;
CREATE POLICY "Users can insert images for their prompts." ON prompt_images FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM prompts WHERE id = prompt_id AND author_id = auth.uid())
);

-- LIKES
DROP POLICY IF EXISTS "Public likes are viewable by everyone." ON likes;
CREATE POLICY "Public likes are viewable by everyone." ON likes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can toggle likes." ON likes;
CREATE POLICY "Users can toggle likes." ON likes FOR ALL USING (auth.uid() = user_id);

-- STORAGE POLICIES (If using storage.objects directly via SQL, otherwise handle in Dashboard)
-- We typically handle Storage RLS in the Dashboard, but this ensures DB safety.
