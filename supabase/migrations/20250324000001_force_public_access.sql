-- FORCE PUBLIC ACCESS FOR IMAGES
-- This script fixes both the Storage Bucket permissions AND the Database Table permissions.

-- 1. STORAGE: Force the bucket to be public
INSERT INTO storage.buckets (id, name, public)
VALUES ('prompt-images', 'prompt-images', true)
ON CONFLICT (id) DO UPDATE
SET public = true;

-- 2. STORAGE POLICIES: Reset and Open Read Access
-- Drop potential conflicting policies
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Allow Public Read" ON storage.objects;
DROP POLICY IF EXISTS "Give me access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
DROP POLICY IF EXISTS "Allow Authenticated Upload" ON storage.objects;

-- Create wide-open read policy for this bucket
CREATE POLICY "Allow Public Read"
ON storage.objects FOR SELECT
USING ( bucket_id = 'prompt-images' );

-- Allow logged-in users to upload
CREATE POLICY "Allow Authenticated Upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'prompt-images' );

-- Allow users to update/delete their own files
CREATE POLICY "Allow Owner Actions"
ON storage.objects FOR ALL
TO authenticated
USING ( bucket_id = 'prompt-images' AND auth.uid() = owner );


-- 3. DATABASE: Fix prompt_images Table RLS
ALTER TABLE prompt_images ENABLE ROW LEVEL SECURITY;

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Public read prompt_images" ON prompt_images;
DROP POLICY IF EXISTS "Enable read access for all users" ON prompt_images;
DROP POLICY IF EXISTS "Users can upload images" ON prompt_images;

-- Allow EVERYONE to read image records
CREATE POLICY "Public read prompt_images"
ON prompt_images FOR SELECT
USING (true);

-- Allow creators to insert/delete their own image records
CREATE POLICY "Creators manage images"
ON prompt_images FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);


-- 4. DATABASE: Fix prompts Table RLS (Just in case)
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read prompts" ON prompts;
DROP POLICY IF EXISTS "Enable read access for all users" ON prompts;

CREATE POLICY "Public read prompts"
ON prompts FOR SELECT
USING (true);
