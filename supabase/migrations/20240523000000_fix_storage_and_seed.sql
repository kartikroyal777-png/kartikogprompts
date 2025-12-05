/*
  # Fix Storage & Seed Demo Data
  
  1. Storage:
     - Ensures 'prompt-images' bucket exists
     - Re-creates policies safely (DROP IF EXISTS) to fix 42710 error
     - Allows public read/write access to storage
  
  2. Schema:
     - Adds missing columns (credit_name, instagram_handle) if they don't exist
     - Updates RLS to allow public inserts to 'prompts' table
     
  3. Data:
     - Seeds 6 demo prompts with high-quality Unsplash images
     
  ## Metadata:
  - Schema-Category: "Safe"
  - Impact-Level: "Medium"
  - Requires-Backup: false
  - Reversible: true
*/

-- 1. Ensure Bucket Exists
insert into storage.buckets (id, name, public)
values ('prompt-images', 'prompt-images', true)
on conflict (id) do update set public = true;

-- 2. Fix Storage Policies (Drop first to avoid "already exists" error)
drop policy if exists "Public Access" on storage.objects;
drop policy if exists "Public Select" on storage.objects;
drop policy if exists "Public Upload" on storage.objects;
drop policy if exists "Give me access" on storage.objects;

-- Create fresh policies
create policy "Public Select"
on storage.objects for select
using ( bucket_id = 'prompt-images' );

create policy "Public Upload"
on storage.objects for insert
with check ( bucket_id = 'prompt-images' );

-- 3. Fix Prompts Table Columns (Idempotent)
do $$
begin
    if not exists (select 1 from information_schema.columns where table_name = 'prompts' and column_name = 'credit_name') then
        alter table prompts add column credit_name text;
    end if;

    if not exists (select 1 from information_schema.columns where table_name = 'prompts' and column_name = 'instagram_handle') then
        alter table prompts add column instagram_handle text;
    end if;
end $$;

-- 4. Update Prompts RLS for Public Uploads
drop policy if exists "Enable insert for authenticated users only" on prompts;
drop policy if exists "Enable insert for everyone" on prompts;

create policy "Enable insert for everyone"
on prompts for insert
with check (true);

-- 5. Seed Demo Data (Only if empty)
do $$
declare
  v_count integer;
  v_prompt_id uuid;
begin
  select count(*) into v_count from prompts;
  
  if v_count = 0 then
    -- Prompt 1: Cyberpunk
    insert into prompts (title, description, category, credit_name, likes_count, is_published, monetization_url)
    values (
      'Neon Cyberpunk City', 
      'A futuristic city street at night, filled with neon signs in pink and blue, rain reflecting on the pavement, cyberpunk style, cinematic lighting, 8k resolution, highly detailed.', 
      'Landscape', 
      'AlexArt', 
      124, 
      true,
      'https://google.com'
    ) returning id into v_prompt_id;
    
    insert into prompt_images (prompt_id, storage_path, thumbnail_path)
    values (v_prompt_id, 'https://images.unsplash.com/photo-1515630278258-407f66498911?q=80&w=800&auto=format&fit=crop', '');

    -- Prompt 2: Cute Puppy
    insert into prompts (title, description, category, credit_name, likes_count, is_published)
    values (
      'Golden Retriever Puppy', 
      'A cute golden retriever puppy sitting in a field of sunflowers, soft natural lighting, bokeh background, shallow depth of field, photography style.', 
      'Animals', 
      'SarahSnaps', 
      89, 
      true
    ) returning id into v_prompt_id;
    
    insert into prompt_images (prompt_id, storage_path, thumbnail_path)
    values (v_prompt_id, 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=800&auto=format&fit=crop', '');

    -- Prompt 3: Portrait
    insert into prompts (title, description, category, credit_name, likes_count, is_published)
    values (
      'Cinematic Portrait', 
      'Close up portrait of a young woman with freckles, blue eyes, dramatic side lighting, rembrandt lighting, hyperrealistic, 85mm lens.', 
      'Women', 
      'PortraitMaster', 
      256, 
      true
    ) returning id into v_prompt_id;
    
    insert into prompt_images (prompt_id, storage_path, thumbnail_path)
    values (v_prompt_id, 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800&auto=format&fit=crop', '');

    -- Prompt 4: Abstract
    insert into prompts (title, description, category, credit_name, likes_count, is_published)
    values (
      'Abstract Fluid Art', 
      'Swirling colors of gold, black and teal, marble texture, liquid fluid art, macro photography, high contrast.', 
      'All', 
      'Fluidity', 
      45, 
      true
    ) returning id into v_prompt_id;
    
    insert into prompt_images (prompt_id, storage_path, thumbnail_path)
    values (v_prompt_id, 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=800&auto=format&fit=crop', '');
  end if;
end $$;
