-- Migration: Add Payout Logic and RPCs

-- 1. Function to calculate available payout balance (Earnings - Requested)
CREATE OR REPLACE FUNCTION get_creator_payout_balance(p_creator_id uuid)
RETURNS numeric AS $$
DECLARE
  v_total_earnings numeric;
  v_total_requested numeric;
BEGIN
  -- Sum gross credits from earnings
  SELECT COALESCE(SUM(gross_credits), 0) INTO v_total_earnings
  FROM creator_earnings
  WHERE creator_id = p_creator_id;

  -- Sum credits requested (pending or paid)
  SELECT COALESCE(SUM(credits_requested), 0) INTO v_total_requested
  FROM payout_requests
  WHERE creator_id = p_creator_id AND status IN ('pending', 'paid');

  RETURN v_total_earnings - v_total_requested;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Function to request a payout
CREATE OR REPLACE FUNCTION request_payout(p_credits numeric, p_details text)
RETURNS uuid AS $$
DECLARE
  v_available numeric;
  v_payout_id uuid;
BEGIN
  -- Check minimum (120 credits = $10)
  IF p_credits < 120 THEN
    RAISE EXCEPTION 'Minimum payout request is 120 credits ($10)';
  END IF;

  -- Check balance
  v_available := get_creator_payout_balance(auth.uid());
  
  IF p_credits > v_available THEN
    RAISE EXCEPTION 'Insufficient funds. Available: %, Requested: %', v_available, p_credits;
  END IF;

  -- Insert request
  INSERT INTO payout_requests (
    creator_id, 
    credits_requested, 
    usd_converted, 
    status, 
    payout_ref
  )
  VALUES (
    auth.uid(),
    p_credits,
    ROUND((p_credits / 12.0), 2), -- 12 credits = $1
    'pending',
    p_details -- Storing payment details (e.g. "PayPal: user@example.com") in ref for MVP
  ) RETURNING id INTO v_payout_id;

  RETURN v_payout_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Grant permissions
GRANT EXECUTE ON FUNCTION get_creator_payout_balance TO authenticated;
GRANT EXECUTE ON FUNCTION request_payout TO authenticated;
