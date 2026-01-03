-- Allow anonymous uploads specifically to the 'requests' folder in 'prompt-images' bucket
-- This ensures users can upload reference images for their requests without logging in

DROP POLICY IF EXISTS "Public Upload Requests" ON storage.objects;

CREATE POLICY "Public Upload Requests" ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'prompt-images' AND 
  (storage.foldername(name))[1] = 'requests'
);
