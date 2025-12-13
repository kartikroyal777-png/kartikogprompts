/*
  # Fix Ebook Purchase and Wallet Ledger
  
  ## Query Description:
  1. Creates the `wallet_ledger` table to track credit transactions.
  2. Updates the `buy_ebook` function to use the ledger and fix the "relation does not exist" error.
  3. Ensures `prompt_contents` has the correct structure for bundles.
  
  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "Medium"
  - Requires-Backup: false
  - Reversible: true
  
  ## Structure Details:
  - Table: `wallet_ledger` (id, user_id, amount_credits, transaction_type, description, created_at)
  - Function: `buy_ebook`
*/

-- 1. Create wallet_ledger table if it doesn't exist
create table if not exists public.wallet_ledger (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  amount_credits int not null,
  transaction_type text not null, -- 'purchase', 'spend', 'payout', 'income'
  description text,
  created_at timestamptz default now()
);

-- Enable RLS on ledger
alter table public.wallet_ledger enable row level security;

-- Policy: Users can view their own ledger entries
create policy "Users can view own ledger"
  on public.wallet_ledger for select
  using ( auth.uid() = user_id );

-- 2. Update/Create buy_ebook function
create or replace function public.buy_ebook(p_cost int)
returns void
language plpgsql
security definer
as $$
declare
  v_balance int;
begin
  -- Check balance
  select balance_credits into v_balance
  from public.wallets
  where user_id = auth.uid();

  if v_balance is null or v_balance < p_cost then
    raise exception 'Insufficient credits';
  end if;

  -- Deduct credits
  update public.wallets
  set balance_credits = balance_credits - p_cost,
      updated_at = now()
  where user_id = auth.uid();

  -- Record in ledger
  insert into public.wallet_ledger (user_id, amount_credits, transaction_type, description)
  values (auth.uid(), -p_cost, 'spend', 'Purchased Ebook');

  -- Record unlock
  insert into public.ebook_unlocks (user_id, unlocked_at)
  values (auth.uid(), now())
  on conflict (user_id) do nothing;
end;
$$;

-- 3. Ensure prompt_contents has bundle_data (idempotent)
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'prompt_contents' and column_name = 'bundle_data') then
    alter table public.prompt_contents add column bundle_data jsonb;
  end if;
end $$;
