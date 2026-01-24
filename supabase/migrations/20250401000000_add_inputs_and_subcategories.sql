-- Add input_image column to prompts table
ALTER TABLE prompts 
ADD COLUMN IF NOT EXISTS input_image text;

-- Add example_input_images column to super_prompts table
ALTER TABLE super_prompts 
ADD COLUMN IF NOT EXISTS example_input_images text[];

-- Add parent_id to categories table for subcategories
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES categories(id) ON DELETE SET NULL;

-- Add index for performance on parent_id
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);
