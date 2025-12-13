-- Fix migration for wallets and functions

-- 1. Drop existing functions to avoid conflicts
drop function if exists public.unlock_prompt(uuid);
drop function if exists public.buy_ebook(integer);
drop function if exists public.buy_ebook(numeric);
drop function if exists public.convert_credits_to_usd(integer);
drop function if exists public.request_usd_payout(numeric, text);

-- 2. Ensure wallets table has withdrawable_credits
do $$
begin
    if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'wallets' and column_name = 'withdrawable_credits') then
        alter table public.wallets add column withdrawable_credits int default 0;
    end if;
end $$;

-- 3. Create wallet_ledger table (referencing user_id directly)
create table if not exists public.wallet_ledger (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) not null,
    amount int not null,
    transaction_type text not null, -- 'credit', 'debit'
    description text,
    metadata jsonb,
    created_at timestamptz default now()
);

-- Enable RLS on ledger
alter table public.wallet_ledger enable row level security;

drop policy if exists "Users can view own ledger" on public.wallet_ledger;
create policy "Users can view own ledger"
    on public.wallet_ledger for select
    using (auth.uid() = user_id);

-- 4. Recreate buy_ebook function
create or replace function public.buy_ebook(p_cost integer)
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
    set balance_credits = balance_credits - p_cost
    where user_id = auth.uid();

    -- Record transaction
    insert into public.wallet_ledger (user_id, amount, transaction_type, description, metadata)
    values (auth.uid(), p_cost, 'debit', 'Purchased Ebook', '{"item": "ebook"}'::jsonb);
end;
$$;

-- 5. Recreate unlock_prompt function
create or replace function public.unlock_prompt(p_prompt_id uuid)
returns jsonb
language plpgsql
security definer
as $$
declare
    v_prompt record;
    v_user_balance int;
    v_creator_id uuid;
    v_price int;
begin
    -- Get prompt details
    select * into v_prompt
    from public.prompts
    where id = p_prompt_id;

    if not found then
        raise exception 'Prompt not found';
    end if;

    v_creator_id := v_prompt.creator_id;
    v_price := v_prompt.price_credits;

    -- Check if already unlocked (via purchase)
    if exists (
        select 1 from public.prompt_purchases
        where user_id = auth.uid() and prompt_id = p_prompt_id
    ) then
        return jsonb_build_object('success', true, 'message', 'Already unlocked');
    end if;

    -- Check balance
    select balance_credits into v_user_balance
    from public.wallets
    where user_id = auth.uid();

    if v_user_balance is null or v_user_balance < v_price then
        raise exception 'Insufficient credits';
    end if;

    -- Deduct from user
    update public.wallets
    set balance_credits = balance_credits - v_price
    where user_id = auth.uid();

    -- Add to creator (Earned Credits)
    if v_creator_id is not null then
        update public.wallets
        set 
            balance_credits = balance_credits + v_price,
            withdrawable_credits = coalesce(withdrawable_credits, 0) + v_price
        where user_id = v_creator_id;
        
        -- Ledger for creator
        insert into public.wallet_ledger (user_id, amount, transaction_type, description, metadata)
        values (v_creator_id, v_price, 'credit', 'Prompt Sale: ' || v_prompt.title, jsonb_build_object('prompt_id', p_prompt_id, 'buyer_id', auth.uid()));
    end if;

    -- Ledger for buyer
    insert into public.wallet_ledger (user_id, amount, transaction_type, description, metadata)
    values (auth.uid(), v_price, 'debit', 'Unlocked Prompt: ' || v_prompt.title, jsonb_build_object('prompt_id', p_prompt_id));

    -- Record purchase
    insert into public.prompt_purchases (user_id, prompt_id, price_credits)
    values (auth.uid(), p_prompt_id, v_price);

    return jsonb_build_object('success', true);
end;
$$;

-- 6. Recreate convert_credits_to_usd
create or replace function public.convert_credits_to_usd(credits_amount int)
returns void
language plpgsql
security definer
as $$
declare
    v_rate decimal := 15.0; -- 15 credits = 1 USD
    v_usd_amount decimal;
    v_wallet record;
begin
    -- Get wallet
    select * into v_wallet
    from public.wallets
    where user_id = auth.uid();

    if v_wallet.withdrawable_credits < credits_amount then
        raise exception 'Insufficient withdrawable credits';
    end if;

    v_usd_amount := credits_amount / v_rate;

    -- Update wallet (deduct credits)
    update public.wallets
    set 
        balance_credits = balance_credits - credits_amount,
        withdrawable_credits = withdrawable_credits - credits_amount
    where user_id = auth.uid();

    -- Update creator profile (add USD)
    update public.creators
    set usd_balance = coalesce(usd_balance, 0) + v_usd_amount
    where id = auth.uid();

    -- Ledger
    insert into public.wallet_ledger (user_id, amount, transaction_type, description, metadata)
    values (auth.uid(), credits_amount, 'debit', 'Converted to USD', jsonb_build_object('usd_amount', v_usd_amount));
end;
$$;

-- 7. Recreate request_usd_payout
create or replace function public.request_usd_payout(p_amount_usd numeric, p_details text)
returns void
language plpgsql
security definer
as $$
declare
    v_creator_usd decimal;
begin
    -- Check Creator USD Balance
    select usd_balance into v_creator_usd
    from public.creators
    where id = auth.uid();

    if v_creator_usd is null or v_creator_usd < p_amount_usd then
        raise exception 'Insufficient USD balance';
    end if;

    -- Deduct USD
    update public.creators
    set usd_balance = usd_balance - p_amount_usd
    where id = auth.uid();

    -- Create Payout Request
    insert into public.payout_requests (creator_id, credits_requested, usd_converted, status, payout_ref)
    values (auth.uid(), 0, p_amount_usd, 'pending', p_details);
end;
$$;
