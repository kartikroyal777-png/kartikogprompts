/*
  # Add Outfit Link to Prompts

  1. Changes
    - Add `outfit_link` column to `prompts` table.
    - This allows creators to link to outfits shown in photography prompts.
*/

ALTER TABLE prompts 
ADD COLUMN IF NOT EXISTS outfit_link text;
