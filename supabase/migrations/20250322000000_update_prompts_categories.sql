-- Add categories column (array of text)
ALTER TABLE prompts ADD COLUMN IF NOT EXISTS categories text[] DEFAULT '{}';

-- Migrate existing single category data to the new array column
UPDATE prompts 
SET categories = ARRAY[category] 
WHERE category IS NOT NULL AND categories = '{}';

-- Create an index for faster array filtering (GIN index)
CREATE INDEX IF NOT EXISTS prompts_categories_idx ON prompts USING GIN (categories);
