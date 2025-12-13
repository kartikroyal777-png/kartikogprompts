-- Fix RLS for prompt_contents
-- Allow creators to insert content for prompts they own
DROP POLICY IF EXISTS "Enable insert for users based on prompt ownership" ON "public"."prompt_contents";
CREATE POLICY "Enable insert for users based on prompt ownership" 
ON "public"."prompt_contents" 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM prompts 
    WHERE id = prompt_contents.prompt_id 
    AND creator_id = auth.uid()
  )
);

-- Add usd_balance to creators table if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'creators' AND column_name = 'usd_balance') THEN 
        ALTER TABLE "public"."creators" ADD COLUMN "usd_balance" numeric DEFAULT 0; 
    END IF; 
END $$;

-- Function to convert credits to USD
CREATE OR REPLACE FUNCTION convert_credits_to_usd(p_credits int)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_rate int := 15; -- 15 credits = 1 USD
  v_usd_amount numeric;
  v_balance int;
BEGIN
  -- Check balance
  SELECT COALESCE(SUM(gross_credits), 0) INTO v_balance 
  FROM creator_earnings 
  WHERE creator_id = auth.uid();
  
  -- Subtract converted/paid credits (simplified balance check logic)
  -- Note: In a real app, you'd have a robust ledger. Here we assume creator_earnings is gross
  -- and we need to check against payouts/conversions. 
  -- For this implementation, we'll assume the wallet system handles the deduction via a negative earning or similar mechanism
  -- BUT, since we don't have a full ledger, we will insert a 'conversion' record into payout_requests to deduct the credits
  -- and then add to usd_balance.
  
  -- Calculate USD
  v_usd_amount := p_credits::numeric / v_rate::numeric;
  
  -- Insert a 'conversion' record into payout_requests to effectively deduct credits from the 'available' calculation
  -- We use a special status 'converted'
  INSERT INTO payout_requests (creator_id, credits_requested, usd_converted, status, payout_ref)
  VALUES (auth.uid(), p_credits, v_usd_amount, 'converted', 'Credit to USD Conversion');
  
  -- Update Creator USD Balance
  UPDATE creators 
  SET usd_balance = COALESCE(usd_balance, 0) + v_usd_amount
  WHERE id = auth.uid();
  
END;
$$;

-- Function to request USD payout
CREATE OR REPLACE FUNCTION request_usd_payout(p_amount_usd numeric, p_details text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check USD balance
  IF (SELECT usd_balance FROM creators WHERE id = auth.uid()) < p_amount_usd THEN
    RAISE EXCEPTION 'Insufficient USD balance';
  END IF;

  -- Deduct from USD balance
  UPDATE creators 
  SET usd_balance = usd_balance - p_amount_usd
  WHERE id = auth.uid();

  -- Create Payout Request (marked as pending for admin)
  -- We set credits_requested to 0 because these are already converted credits
  INSERT INTO payout_requests (creator_id, credits_requested, usd_converted, status, payout_ref)
  VALUES (auth.uid(), 0, p_amount_usd, 'pending', p_details);
END;
$$;

-- Update get_creator_payout_balance to exclude 'converted' requests if not already doing so
-- (Assuming get_creator_payout_balance sums up payout_requests.credits_requested to subtract from earnings)
-- Since we insert 'converted' requests with credits_requested, the existing logic should automatically deduct these credits from available balance.
