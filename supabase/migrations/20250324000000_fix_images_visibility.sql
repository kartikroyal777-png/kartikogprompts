-- FORCE FIX IMAGE VISIBILITY
-- This migration ensures public access to prompt images and storage

-- 1. Fix Table Permissions (prompt_images)
ALTER TABLE prompt_images ENABLE ROW LEVEL SECURITY;

-- Drop existing conflicting policies to be safe
DROP POLICY IF EXISTS "Public read access" ON prompt_images;
DROP POLICY IF EXISTS "Give public access to prompt_images" ON prompt_images;
DROP POLICY IF EXISTS "Allow public read" ON prompt_images;

-- Create a blanket public read policy
CREATE POLICY "Public read access" 
ON prompt_images 
FOR SELECT 
USING (true);

-- 2. Fix Storage Permissions (prompt-images bucket)
-- Ensure the bucket is public
UPDATE storage.buckets
SET public = true
WHERE id = 'prompt-images';

-- Drop existing storage policies for this bucket
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Give public access to prompt-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read on prompt-images" ON storage.objects;

-- Create explicit public read policy for the bucket
CREATE POLICY "Allow public read on prompt-images"
ON storage.objects
FOR SELECT
USING ( bucket_id = 'prompt-images' );

-- 3. Fix Prompts Table Permissions (just in case)
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read access" ON prompts;
CREATE POLICY "Public read access" 
ON prompts 
FOR SELECT 
USING (true);
