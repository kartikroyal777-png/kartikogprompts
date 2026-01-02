-- Add prompt_type to prompts table
ALTER TABLE prompts 
ADD COLUMN IF NOT EXISTS prompt_type text DEFAULT 'standard';

-- Add type to categories table
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS type text DEFAULT 'standard';

-- Update existing records to be standard
UPDATE prompts SET prompt_type = 'standard' WHERE prompt_type IS NULL;
UPDATE categories SET type = 'standard' WHERE type IS NULL;

-- Create index for faster filtering
CREATE INDEX IF NOT EXISTS idx_prompts_type ON prompts(prompt_type);
CREATE INDEX IF NOT EXISTS idx_categories_type ON categories(type);
