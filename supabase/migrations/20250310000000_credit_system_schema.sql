-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Profiles (Extends auth.users)
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text,
  display_name text,
  avatar_url text,
  role text default 'user', -- user, creator, admin
  is_pro boolean default false,
  pro_since timestamptz,
  pro_badge boolean default false,
  creator_badge boolean default false,
  created_at timestamptz default now()
);

-- 2. Creators
create table if not exists public.creators (
  id uuid references public.profiles(id) on delete cascade primary key,
  bio text,
  social_instagram text,
  social_youtube text,
  social_x text,
  website text,
  full_access_price_credits numeric(10,1) default 10.0,
  last_prompt_price_credits numeric(10,1),
  payout_method text,
  payout_details jsonb,
  created_at timestamptz default now()
);

-- 3. Wallets
create table if not exists public.wallets (
  user_id uuid references public.profiles(id) on delete cascade primary key,
  balance_credits numeric(14,1) default 0
);

-- 4. Wallet Ledger
create table if not exists public.wallet_ledger (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id),
  delta_credits numeric(14,1),
  reason text,
  ref_id uuid,
  created_at timestamptz default now()
);

-- 5. Update Prompts Table
alter table public.prompts 
add column if not exists creator_id uuid references public.creators(id),
add column if not exists model text,
add column if not exists tags text[],
add column if not exists cover_path text,
add column if not exists preview_text text,
add column if not exists full_text text,
add column if not exists is_paid boolean default false,
add column if not exists price_credits numeric(10,1),
add column if not exists is_active boolean default true;

-- 6. Likes (DB based now)
create table if not exists public.likes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id),
  prompt_id uuid references public.prompts(id),
  created_at timestamptz default now(),
  unique(user_id, prompt_id)
);

-- 7. Creator Unlocks
create table if not exists public.creator_unlocks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id),
  creator_id uuid references public.creators(id),
  spent_credits numeric(14,1),
  created_at timestamptz default now(),
  unique(user_id, creator_id)
);

-- 8. Prompt Purchases
create table if not exists public.prompt_purchases (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id),
  prompt_id uuid references public.prompts(id),
  spent_credits numeric(14,1),
  created_at timestamptz default now(),
  unique(user_id, prompt_id)
);

-- 9. Payments
create table if not exists public.payments (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id),
  amount_usd int,
  credits_added numeric(14,1),
  stripe_session_id text,
  stripe_payment_intent text,
  status text,
  created_at timestamptz default now()
);

-- 10. Creator Earnings
create table if not exists public.creator_earnings (
  id uuid default gen_random_uuid() primary key,
  creator_id uuid references public.creators(id),
  from_user_id uuid references public.profiles(id),
  source_type text,
  source_id uuid,
  gross_credits numeric(14,1),
  created_at timestamptz default now()
);

-- 11. Payout Requests
create table if not exists public.payout_requests (
  id uuid default gen_random_uuid() primary key,
  creator_id uuid references public.creators(id),
  credits_requested numeric(14,1),
  usd_converted numeric(14,2),
  status text default 'pending',
  payout_ref text,
  created_at timestamptz default now(),
  paid_at timestamptz
);

-- RLS Policies
alter table profiles enable row level security;
create policy "Public profiles" on profiles for select using (true);
create policy "Self update profiles" on profiles for update using (auth.uid() = id);
create policy "Self insert profiles" on profiles for insert with check (auth.uid() = id);

alter table wallets enable row level security;
create policy "Self read wallet" on wallets for select using (auth.uid() = user_id);

alter table creators enable row level security;
create policy "Public read creators" on creators for select using (true);
create policy "Self update creators" on creators for update using (auth.uid() = id);
create policy "Self insert creators" on creators for insert with check (auth.uid() = id);

alter table prompts enable row level security;
create policy "Public read prompts" on prompts for select using (true);
create policy "Creator insert prompts" on prompts for insert with check (auth.uid() = creator_id);
create policy "Creator update prompts" on prompts for update using (auth.uid() = creator_id);
create policy "Admin delete prompts" on prompts for delete using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

alter table creator_unlocks enable row level security;
create policy "Self read unlocks" on creator_unlocks for select using (auth.uid() = user_id);

alter table prompt_purchases enable row level security;
create policy "Self read purchases" on prompt_purchases for select using (auth.uid() = user_id);

-- Functions
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  
  insert into public.wallets (user_id, balance_credits)
  values (new.id, 0);
  
  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if exists to avoid conflict
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- RPC: Unlock Prompt
create or replace function unlock_prompt(p_prompt_id uuid)
returns void as $$
declare
  v_user_id uuid;
  v_price numeric;
  v_creator_id uuid;
  v_balance numeric;
begin
  v_user_id := auth.uid();
  
  select price_credits, creator_id into v_price, v_creator_id
  from public.prompts where id = p_prompt_id;
  
  select balance_credits into v_balance from public.wallets where user_id = v_user_id;
  
  if v_balance < v_price then
    raise exception 'Insufficient credits';
  end if;
  
  update public.wallets set balance_credits = balance_credits - v_price where user_id = v_user_id;
  
  insert into public.prompt_purchases (user_id, prompt_id, spent_credits)
  values (v_user_id, p_prompt_id, v_price);
  
  insert into public.wallet_ledger (user_id, delta_credits, reason, ref_id)
  values (v_user_id, -v_price, 'unlock_prompt', p_prompt_id);
  
  insert into public.creator_earnings (creator_id, from_user_id, source_type, source_id, gross_credits)
  values (v_creator_id, v_user_id, 'unlock_prompt', p_prompt_id, v_price);
end;
$$ language plpgsql security definer;

-- RPC: Unlock Creator
create or replace function unlock_creator(p_creator_id uuid)
returns void as $$
declare
  v_user_id uuid;
  v_price numeric;
  v_balance numeric;
begin
  v_user_id := auth.uid();
  
  select full_access_price_credits into v_price
  from public.creators where id = p_creator_id;
  
  select balance_credits into v_balance from public.wallets where user_id = v_user_id;
  
  if v_balance < v_price then
    raise exception 'Insufficient credits';
  end if;
  
  update public.wallets set balance_credits = balance_credits - v_price where user_id = v_user_id;
  
  insert into public.creator_unlocks (user_id, creator_id, spent_credits)
  values (v_user_id, p_creator_id, v_price);
  
  insert into public.wallet_ledger (user_id, delta_credits, reason, ref_id)
  values (v_user_id, -v_price, 'unlock_creator', p_creator_id);
  
  insert into public.creator_earnings (creator_id, from_user_id, source_type, source_id, gross_credits)
  values (p_creator_id, v_user_id, 'unlock_creator', p_creator_id, v_price);
end;
$$ language plpgsql security definer;

-- RPC: Simulate Topup (For Demo)
create or replace function simulate_topup(p_amount_credits numeric)
returns void as $$
declare
  v_user_id uuid;
begin
  v_user_id := auth.uid();
  
  update public.wallets set balance_credits = balance_credits + p_amount_credits where user_id = v_user_id;
  
  insert into public.wallet_ledger (user_id, delta_credits, reason)
  values (v_user_id, p_amount_credits, 'topup');
  
  update public.profiles set is_pro = true, pro_badge = true, pro_since = now() where id = v_user_id;
end;
$$ language plpgsql security definer;

-- RPC: Check if unlocked
create or replace function check_access(p_prompt_id uuid, p_creator_id uuid)
returns boolean as $$
declare
  v_user_id uuid;
  v_has_prompt boolean;
  v_has_creator boolean;
begin
  v_user_id := auth.uid();
  
  -- Check prompt purchase
  select exists(select 1 from public.prompt_purchases where user_id = v_user_id and prompt_id = p_prompt_id) into v_has_prompt;
  
  -- Check creator unlock
  select exists(select 1 from public.creator_unlocks where user_id = v_user_id and creator_id = p_creator_id) into v_has_creator;
  
  return v_has_prompt or v_has_creator;
end;
$$ language plpgsql security definer;
