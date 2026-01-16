-- Add likes_count to super_prompts if it doesn't exist
ALTER TABLE public.super_prompts 
ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;

-- Create super_prompt_likes table
CREATE TABLE IF NOT EXISTS public.super_prompt_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    super_prompt_id UUID REFERENCES public.super_prompts(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, super_prompt_id)
);

-- Enable RLS
ALTER TABLE public.super_prompt_likes ENABLE ROW LEVEL SECURITY;

-- Policies for super_prompt_likes
CREATE POLICY "Users can view all likes" 
ON public.super_prompt_likes FOR SELECT 
USING (true);

CREATE POLICY "Users can insert their own likes" 
ON public.super_prompt_likes FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes" 
ON public.super_prompt_likes FOR DELETE 
USING (auth.uid() = user_id);

-- Function to increment super prompt likes
CREATE OR REPLACE FUNCTION increment_super_prompt_likes(p_prompt_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.super_prompts
  SET likes_count = likes_count + 1
  WHERE id = p_prompt_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrement super prompt likes
CREATE OR REPLACE FUNCTION decrement_super_prompt_likes(p_prompt_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.super_prompts
  SET likes_count = GREATEST(0, likes_count - 1)
  WHERE id = p_prompt_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
