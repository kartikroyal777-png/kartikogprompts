-- Add buy_look_links to prompts table for multiple outfit links
ALTER TABLE prompts 
ADD COLUMN IF NOT EXISTS buy_look_links JSONB DEFAULT '[]'::jsonb;

-- Add thumbnail_image to super_prompts for the poster
ALTER TABLE super_prompts 
ADD COLUMN IF NOT EXISTS thumbnail_image TEXT;

-- Ensure RLS allows reading these new columns
-- (Existing policies usually cover 'select *', but good to be safe if specific columns were listed, 
-- though standard Supabase 'select' policies are usually row-based)
