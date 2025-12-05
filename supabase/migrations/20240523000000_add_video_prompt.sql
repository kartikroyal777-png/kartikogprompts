/*
  # Add Video Prompt Column
  Adds a column for video-specific prompts.
  ## Metadata:
  - Schema-Category: "Safe"
  - Impact-Level: "Low"
  - Requires-Backup: false
  - Reversible: true
*/
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'prompts' and column_name = 'video_prompt') then
    alter table prompts add column video_prompt text;
  end if;
end $$;
