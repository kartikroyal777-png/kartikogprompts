/*
  # Reset Likes
  Resets the likes count for all prompts to 0.

  ## Query Description:
  This operation updates the 'likes_count' column in the 'prompts' table, setting it to 0 for all rows.
  This is a data reset operation requested by the user.

  ## Metadata:
  - Schema-Category: "Data"
  - Impact-Level: "Medium" (Modifies all rows)
  - Requires-Backup: false
  - Reversible: false (Data loss of like counts)

  ## Structure Details:
  - Table: public.prompts
  - Column: likes_count
*/

UPDATE public.prompts SET likes_count = 0;
