/*
  # Fix upgrade_to_pro function
  
  Creates the missing upgrade_to_pro function required for the Pro plan upgrade flow.
  Also ensures it has the correct security settings.
*/

-- Create the function with the correct signature (uuid, text)
CREATE OR REPLACE FUNCTION public.upgrade_to_pro(p_user_id uuid, p_affiliate_id text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_affiliate_uuid uuid;
BEGIN
  -- 1. Update the user to PRO
  UPDATE public.profiles
  SET plan_type = 'pro'
  WHERE id = p_user_id;

  -- 2. Handle Affiliate Logic
  IF p_affiliate_id IS NOT NULL AND p_affiliate_id != '' THEN
    BEGIN
      v_affiliate_uuid := p_affiliate_id::uuid;
      
      -- Prevent self-referral
      IF v_affiliate_uuid != p_user_id THEN
        -- Check if affiliate exists
        IF EXISTS (SELECT 1 FROM public.profiles WHERE id = v_affiliate_uuid) THEN
           -- Update Wallet (Add 10 credits)
           -- Using INSERT ON CONFLICT to ensure it works even if wallet row is missing (though triggers usually handle creation)
           INSERT INTO public.wallets (user_id, balance_credits, withdrawable_credits)
           VALUES (v_affiliate_uuid, 10, 10)
           ON CONFLICT (user_id) DO UPDATE
           SET 
             balance_credits = wallets.balance_credits + 10,
             withdrawable_credits = wallets.withdrawable_credits + 10,
             updated_at = now();
        END IF;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      -- Ignore invalid UUID format for affiliate_id or other errors to prevent blocking the upgrade
      NULL;
    END;
  END IF;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.upgrade_to_pro(uuid, text) TO authenticated;
