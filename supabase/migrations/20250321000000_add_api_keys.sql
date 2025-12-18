-- Create API Keys table for dynamic key management
create table if not exists public.api_keys (
  id uuid default gen_random_uuid() primary key,
  key_value text not null,
  provider text default 'openrouter',
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.api_keys enable row level security;

-- Policies
-- Allow public read access so the client can rotate keys (Note: In a production app with backend, this would be hidden)
create policy "Allow public read access" on public.api_keys for select using (true);

-- Allow admin only to insert/delete (checking specific email or if user is admin)
create policy "Allow admin insert" on public.api_keys for insert with check (
  auth.email() = 'kartikroyal777@gmail.com'
);

create policy "Allow admin delete" on public.api_keys for delete using (
  auth.email() = 'kartikroyal777@gmail.com'
);
