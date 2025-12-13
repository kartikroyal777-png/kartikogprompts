/*
  # Create Payout Requests Table

  ## Query Description:
  Creates the `payout_requests` table to track creator withdrawal requests.
  Includes foreign key to profiles, RLS policies for admin/creator access.

  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "Medium"
  - Requires-Backup: false
  - Reversible: true

  ## Structure Details:
  - Table: payout_requests
  - Columns: id, creator_id, usd_converted, credits_requested, status, payout_ref, paid_at, created_at
*/

create table if not exists public.payout_requests (
  id uuid default gen_random_uuid() primary key,
  creator_id uuid references public.profiles(id) on delete cascade not null,
  usd_converted numeric not null,
  credits_requested integer not null,
  status text default 'pending',
  payout_ref text,
  paid_at timestamp with time zone,
  created_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.payout_requests enable row level security;

-- Policies
-- Allow read access (needed for Admin panel to fetch requests)
create policy "Enable read access for all users" 
  on public.payout_requests for select 
  using (true);

-- Allow creators to insert their own requests
create policy "Enable insert access for authenticated users" 
  on public.payout_requests for insert 
  with check (auth.uid() = creator_id);

-- Allow updates (needed for Admin panel to mark as paid)
create policy "Enable update access for all users" 
  on public.payout_requests for update 
  using (true);
