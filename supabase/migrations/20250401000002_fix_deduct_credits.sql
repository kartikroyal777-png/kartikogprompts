/*
# Fix Deduct Credits Function
Re-creates the deduct_credits function to ensure it exists and has the correct signature.
Includes security best practices (search_path).

## Metadata
- Schema-Category: "Safe"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true
*/

-- Create or Replace the function to ensure it exists
CREATE OR REPLACE FUNCTION public.deduct_credits(
    p_user_id uuid,
    p_amount integer,
    p_description text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_current_balance integer;
BEGIN
    -- Check current balance
    SELECT balance_credits INTO v_current_balance
    FROM public.wallets
    WHERE user_id = p_user_id;

    -- If no wallet or insufficient funds
    IF v_current_balance IS NULL OR v_current_balance < p_amount THEN
        RETURN false;
    END IF;

    -- Deduct credits
    UPDATE public.wallets
    SET 
        balance_credits = balance_credits - p_amount,
        updated_at = now()
    WHERE user_id = p_user_id;

    -- (Optional) Log to ledger if you have a ledger table
    -- INSERT INTO public.credit_ledger (user_id, amount, description, type)
    -- VALUES (p_user_id, -p_amount, p_description, 'debit');
    
    RETURN true;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.deduct_credits(uuid, integer, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.deduct_credits(uuid, integer, text) TO service_role;
