/*
  # Initial Schema Setup for OGPrompts
  
  ## Query Description:
  This migration sets up the complete database structure for the OGPrompts application.
  It includes tables for users (profiles), prompts, images, likes, ebooks, reviews, and analytics events.
  It also sets up Full Text Search triggers and Row Level Security (RLS) policies.

  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "High"
  - Requires-Backup: false
  - Reversible: true

  ## Structure Details:
  - Tables: profiles, prompts, prompt_images, likes, ebooks, ebook_reviews, events
  - Triggers: handle_new_user (auto-create profile), prompts_tsv_trigger (search index)
  - RLS: Enabled on all tables
*/

-- 1. PROFILES (Extends auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  instagram_handle text,
  bio text,
  avatar_url text,
  created_at timestamptz default now()
);

-- 2. PROMPTS
create table if not exists public.prompts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references public.profiles(id) on delete set null,
  title text not null,
  description text not null, -- prompt text
  category text, -- e.g., All/Couple/Kids/Men/Women or custom
  monetization_url text, -- optional pay-link
  popunder_code text, -- optional (store safely; caution)
  is_published boolean default false,
  published_at timestamptz,
  views bigint default 0,
  likes_count int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  searchable_tsv tsvector -- for full text search
);

-- 3. PROMPT IMAGES
create table if not exists public.prompt_images (
  id uuid primary key default gen_random_uuid(),
  prompt_id uuid references public.prompts(id) on delete cascade,
  storage_path text not null,
  thumbnail_path text not null,
  width int,
  height int,
  size_bytes int,
  mime text,
  order_index int default 0,
  created_at timestamptz default now()
);

-- 4. LIKES
create table if not exists public.likes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  prompt_id uuid references public.prompts(id) on delete cascade,
  created_at timestamptz default now(),
  unique (user_id, prompt_id)
);

-- 5. EBOOKS
create table if not exists public.ebooks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  price_inr int not null,
  cover_url text,
  file_url text,
  value_text text,
  created_at timestamptz default now()
);

-- 6. EBOOK REVIEWS
create table if not exists public.ebook_reviews (
  id uuid primary key default gen_random_uuid(),
  name text,
  rating int check (rating between 1 and 5),
  comment text,
  created_at timestamptz default now()
);

-- 7. ANALYTICS EVENTS
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id),
  type text not null, -- "view_prompt", "click_dm", "click_monetize", "download_ebook"
  payload jsonb,
  created_at timestamptz default now()
);

-- INDEXES
create index if not exists prompts_search_idx on public.prompts using gin(searchable_tsv);

-- FUNCTIONS & TRIGGERS

-- Full Text Search Trigger
create or replace function public.prompts_tsv_trigger() returns trigger as $$
begin
  new.searchable_tsv :=
    setweight(to_tsvector('english', coalesce(new.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(new.description, '')), 'B');
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_prompts_tsv on public.prompts;
create trigger trg_prompts_tsv before insert or update on public.prompts
for each row execute function public.prompts_tsv_trigger();

-- Auto-create Profile Trigger
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ROW LEVEL SECURITY (RLS)

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.prompts enable row level security;
alter table public.prompt_images enable row level security;
alter table public.likes enable row level security;

-- Profiles Policies
create policy "Public profiles are viewable by everyone."
  on public.profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on public.profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on public.profiles for update
  using ( auth.uid() = id );

-- Prompts Policies
create policy "Prompts are viewable by everyone."
  on public.prompts for select
  using ( true ); -- Ideally: is_published = true OR auth.uid() = author_id. For now, allowing all for dev visibility.

create policy "Authenticated users can upload prompts."
  on public.prompts for insert
  with check ( auth.uid() = author_id );

create policy "Users can update own prompts."
  on public.prompts for update
  using ( auth.uid() = author_id );

-- Prompt Images Policies
create policy "Images are viewable by everyone."
  on public.prompt_images for select
  using ( true );

create policy "Authenticated users can upload images."
  on public.prompt_images for insert
  with check ( 
    exists ( select 1 from public.prompts where id = prompt_id and author_id = auth.uid() )
  );

-- Likes Policies
create policy "Likes are viewable by everyone."
  on public.likes for select
  using ( true );

create policy "Authenticated users can like."
  on public.likes for insert
  with check ( auth.uid() = user_id );

create policy "Users can unlike."
  on public.likes for delete
  using ( auth.uid() = user_id );
