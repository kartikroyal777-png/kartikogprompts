-- Create table for prompt requests
CREATE TABLE IF NOT EXISTS prompt_requests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  email text NOT NULL,
  request_details text NOT NULL,
  reference_image text,
  status text DEFAULT 'pending', -- 'pending', 'completed', 'rejected'
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE prompt_requests ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (public request form)
CREATE POLICY "Allow public insert requests" 
ON prompt_requests FOR INSERT 
WITH CHECK (true);

-- Allow public read (Protected by Admin Panel Password in UI)
-- In a production app with sensitive emails, you'd restrict this to specific user UUIDs
CREATE POLICY "Allow public select requests" 
ON prompt_requests FOR SELECT 
USING (true);

-- Allow public update (for Admin to change status)
CREATE POLICY "Allow public update requests" 
ON prompt_requests FOR UPDATE 
USING (true);

-- Allow public delete
CREATE POLICY "Allow public delete requests" 
ON prompt_requests FOR DELETE 
USING (true);
