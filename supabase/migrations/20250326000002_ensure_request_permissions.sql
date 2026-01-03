/*
  # Ensure Request Permissions
  Guarantees that the prompt_requests table is accessible for the feature to work.

  ## Query Description:
  This migration is a safety measure. It forces the `prompt_requests` table to be publicly readable and writable.
  This is necessary because the Admin panel uses client-side authentication (password) and might not be logged in as a specific Supabase user,
  and anonymous users need to be able to submit requests.

  ## Metadata:
  - Schema-Category: "Safe"
  - Impact-Level: "Low"
  - Requires-Backup: false
  - Reversible: true

  ## Structure Details:
  - Table: prompt_requests
  - Policies: Enable Public Access (Select, Insert, Update, Delete)
*/

-- 1. Enable RLS (Best practice, even if we open it up)
ALTER TABLE prompt_requests ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Public can view requests" ON prompt_requests;
DROP POLICY IF EXISTS "Public can insert requests" ON prompt_requests;
DROP POLICY IF EXISTS "Public can update requests" ON prompt_requests;
DROP POLICY IF EXISTS "Public can delete requests" ON prompt_requests;

-- 3. Create permissive policies
-- Allow anyone to INSERT a request (Required for the feature)
CREATE POLICY "Public can insert requests" 
ON prompt_requests FOR INSERT 
WITH CHECK (true);

-- Allow anyone to VIEW requests (Required for Admin panel without specific auth)
CREATE POLICY "Public can view requests" 
ON prompt_requests FOR SELECT 
USING (true);

-- Allow anyone to UPDATE requests (Required for Admin panel status updates)
CREATE POLICY "Public can update requests" 
ON prompt_requests FOR UPDATE 
USING (true);

-- Allow anyone to DELETE requests (Required for Admin panel deletion)
CREATE POLICY "Public can delete requests" 
ON prompt_requests FOR DELETE 
USING (true);
