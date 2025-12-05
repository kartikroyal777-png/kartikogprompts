-- 1. Fix "RLS Enabled No Policy" for prompt_images
-- Enable RLS to ensure security best practices
ALTER TABLE IF EXISTS prompt_images ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anyone (anon and authenticated) to view images
-- This ensures images load correctly on the home page
DROP POLICY IF EXISTS "Public read access" ON prompt_images;
CREATE POLICY "Public read access"
ON prompt_images FOR SELECT
USING (true);

-- Policy: Allow anyone to upload images
-- This supports the "upload without login" feature
DROP POLICY IF EXISTS "Public insert access" ON prompt_images;
CREATE POLICY "Public insert access"
ON prompt_images FOR INSERT
WITH CHECK (true);
