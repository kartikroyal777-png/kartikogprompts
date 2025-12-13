/*
  # Add Categories Table
  
  1. New Tables
    - `categories`
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `created_at` (timestamp)
  2. Security
    - Enable RLS on `categories` table
    - Add policy for public read access
    - Add policy for authenticated users to insert/delete (for admin usage)
  3. Seed Data
    - Insert initial categories
*/

CREATE TABLE IF NOT EXISTS public.categories (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read categories
CREATE POLICY "Allow public read access" ON public.categories 
  FOR SELECT USING (true);

-- Allow authenticated users (Admin) to manage categories
-- In a production app, you might want strictly Admin role checks here
CREATE POLICY "Allow authenticated insert" ON public.categories 
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated delete" ON public.categories 
  FOR DELETE USING (auth.role() = 'authenticated');

-- Seed initial categories
INSERT INTO public.categories (name) VALUES
('Couple'), ('Kids'), ('Men'), ('Women'), ('Animals'), ('Landscape')
ON CONFLICT (name) DO NOTHING;
