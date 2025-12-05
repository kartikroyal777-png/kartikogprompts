/*
  # Add Likes RPC Functions
  Adds remote procedure calls to safely increment and decrement prompt likes.

  ## Query Description: 
  This migration creates two database functions: `increment_prompt_likes` and `decrement_prompt_likes`.
  These functions allow the frontend to update the `likes_count` column atomically without needing direct update permissions on the table.
  
  ## Metadata:
  - Schema-Category: "Safe"
  - Impact-Level: "Low"
  - Requires-Backup: false
  - Reversible: true
  
  ## Structure Details:
  - Functions: increment_prompt_likes(uuid), decrement_prompt_likes(uuid)
  - Table Affected: prompts (column: likes_count)
  
  ## Security Implications:
  - RLS Status: Functions are SECURITY DEFINER, meaning they bypass RLS to perform this specific action.
*/

-- Create a function to increment likes safely
create or replace function increment_prompt_likes(p_prompt_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  update prompts
  set likes_count = coalesce(likes_count, 0) + 1
  where id = p_prompt_id;
end;
$$;

-- Create a function to decrement likes safely (preventing negative numbers)
create or replace function decrement_prompt_likes(p_prompt_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  update prompts
  set likes_count = greatest(0, coalesce(likes_count, 0) - 1)
  where id = p_prompt_id;
end;
$$;
