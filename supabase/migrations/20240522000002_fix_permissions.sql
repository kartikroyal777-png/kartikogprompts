/*
  # Fix RLS Policies for Public Access & Video Prompt
  
  1. Ensures 'video_prompt' column exists.
  2. Resets and creates permissive RLS policies for Prompts, Likes, and Images.
     This allows unauthenticated users to Upload and Like.
  3. Fixes Storage permissions.

  ## Metadata:
  - Schema-Category: "Security"
  - Impact-Level: "High"
  - Requires-Backup: false
  - Reversible: true
*/

-- 1. Ensure video_prompt column exists (idempotent)
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'prompts' and column_name = 'video_prompt') then
    alter table prompts add column video_prompt text;
  end if;
end $$;

-- 2. Enable RLS (if not already)
alter table prompts enable row level security;
alter table likes enable row level security;
alter table prompt_images enable row level security;

-- 3. Drop existing restrictive policies to avoid conflicts
drop policy if exists "Public Access Prompts" on prompts;
drop policy if exists "Public Access Likes" on likes;
drop policy if exists "Public Access Images" on prompt_images;
drop policy if exists "Public Insert Prompts" on prompts;
drop policy if exists "Public Update Likes" on likes;

-- 4. Create Permissive Policies (Allow All Actions for Public)

-- Prompts: Everyone can read and insert
create policy "Public Access Prompts"
on prompts
for all
using (true)
with check (true);

-- Likes: Everyone can read and insert/update (toggle likes)
create policy "Public Access Likes"
on likes
for all
using (true)
with check (true);

-- Prompt Images: Everyone can read and insert
create policy "Public Access Images"
on prompt_images
for all
using (true)
with check (true);

-- 5. Fix Storage Permissions
insert into storage.buckets (id, name, public)
values ('prompt-images', 'prompt-images', true)
on conflict (id) do update set public = true;

drop policy if exists "Public Storage Access" on storage.objects;

create policy "Public Storage Access"
on storage.objects
for all
using ( bucket_id = 'prompt-images' )
with check ( bucket_id = 'prompt-images' );
