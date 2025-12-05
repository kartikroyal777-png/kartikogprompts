/*
  # Security Fixes & RLS Policies
  
  ## Query Description: 
  This migration addresses critical security advisories by enabling Row Level Security (RLS) on all public tables and defining access policies. It also fixes the search_path for functions and sets up a trigger for automatic profile creation.
  
  ## Metadata:
  - Schema-Category: "Security"
  - Impact-Level: "High"
  - Requires-Backup: false
  - Reversible: true
  
  ## Security Implications:
  - RLS Status: Enabled for all tables
  - Policy Changes: Yes, comprehensive policies added
  - Auth Requirements: Policies rely on auth.uid()
*/

-- 1. Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ebook_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE ebooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- 2. Profiles Policies
CREATE POLICY "Public profiles are viewable by everyone." 
  ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile." 
  ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile." 
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- 3. Prompts Policies
CREATE POLICY "Prompts are viewable by everyone." 
  ON prompts FOR SELECT USING (true);

CREATE POLICY "Users can insert their own prompts." 
  ON prompts FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update own prompts." 
  ON prompts FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Users can delete own prompts." 
  ON prompts FOR DELETE USING (auth.uid() = author_id);

-- 4. Prompt Images Policies
CREATE POLICY "Images are viewable by everyone." 
  ON prompt_images FOR SELECT USING (true);

CREATE POLICY "Users can insert images to own prompts." 
  ON prompt_images FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM prompts WHERE id = prompt_id AND author_id = auth.uid())
  );

CREATE POLICY "Users can delete images from own prompts." 
  ON prompt_images FOR DELETE USING (
    EXISTS (SELECT 1 FROM prompts WHERE id = prompt_id AND author_id = auth.uid())
  );

-- 5. Likes Policies
CREATE POLICY "Likes are viewable by everyone." 
  ON likes FOR SELECT USING (true);

CREATE POLICY "Users can insert own likes." 
  ON likes FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own likes." 
  ON likes FOR DELETE USING (auth.uid() = user_id);

-- 6. Ebooks & Reviews Policies (Basic)
CREATE POLICY "Ebooks are viewable by everyone." 
  ON ebooks FOR SELECT USING (true);

CREATE POLICY "Reviews are viewable by everyone." 
  ON ebook_reviews FOR SELECT USING (true);

CREATE POLICY "Users can insert reviews." 
  ON ebook_reviews FOR INSERT WITH CHECK (true); -- Basic allow for now

-- 7. Events Policies
CREATE POLICY "Users can insert events." 
  ON events FOR INSERT WITH CHECK (true); -- Allow logging

-- 8. Fix Function Search Path (Security Advisory)
CREATE OR REPLACE FUNCTION prompts_tsv_trigger() RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  new.searchable_tsv :=
    setweight(to_tsvector('english', coalesce(new.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(new.description, '')), 'B');
  RETURN new;
END;
$$;

-- 9. Profile Creation Trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (new.id, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
