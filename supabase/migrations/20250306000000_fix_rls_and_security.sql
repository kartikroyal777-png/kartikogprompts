-- 1. Fix "Function Search Path Mutable" warnings
-- Secure the previously created functions by explicitly setting the search_path to 'public'
-- This prevents malicious code from hijacking the function execution path
ALTER FUNCTION increment_prompt_likes(uuid) SET search_path = public;
ALTER FUNCTION decrement_prompt_likes(uuid) SET search_path = public;

-- 2. Fix "RLS Enabled No Policy" warnings for the prompts table
-- Ensure RLS is enabled
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anyone (anon and authenticated) to view prompts
-- This fixes the issue where the home page might appear empty
DROP POLICY IF EXISTS "Public read access" ON prompts;
CREATE POLICY "Public read access"
ON prompts FOR SELECT
USING (true);

-- Policy: Allow anyone to upload prompts
-- This supports your "upload without login" feature
DROP POLICY IF EXISTS "Public insert access" ON prompts;
CREATE POLICY "Public insert access"
ON prompts FOR INSERT
WITH CHECK (true);
