-- 1. Ensure 'is_paid' exists on prompts (Fixing the schema cache error)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'prompts' AND column_name = 'is_paid') THEN
        ALTER TABLE prompts ADD COLUMN is_paid boolean DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'prompts' AND column_name = 'price_credits') THEN
        ALTER TABLE prompts ADD COLUMN price_credits numeric(10,1);
    END IF;
END $$;

-- 2. Add Bundle Support
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'prompts' AND column_name = 'is_bundle') THEN
        ALTER TABLE prompts ADD COLUMN is_bundle boolean DEFAULT false;
    END IF;
END $$;

-- 3. Add Bundle Data to Secure Content
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'prompt_contents' AND column_name = 'bundle_data') THEN
        ALTER TABLE prompt_contents ADD COLUMN bundle_data jsonb DEFAULT '[]'::jsonb;
    END IF;
END $$;

-- 4. Re-define buy_ebook function (Fixing the function not found error)
CREATE OR REPLACE FUNCTION buy_ebook(p_cost numeric)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_balance numeric;
BEGIN
  v_user_id := auth.uid();
  
  -- Check balance
  SELECT balance_credits INTO v_balance FROM wallets WHERE user_id = v_user_id;
  
  IF v_balance IS NULL OR v_balance < p_cost THEN
    RAISE EXCEPTION 'Insufficient credits';
  END IF;

  -- Deduct
  UPDATE wallets SET balance_credits = balance_credits - p_cost WHERE user_id = v_user_id;
  
  -- Ledger
  INSERT INTO wallet_ledger (user_id, delta_credits, reason, ref_id)
  VALUES (v_user_id, -p_cost, 'ebook_purchase', v_user_id);
  
  -- Record Unlock
  INSERT INTO ebook_unlocks (user_id, spent_credits)
  VALUES (v_user_id, p_cost)
  ON CONFLICT (user_id) DO NOTHING;
END;
$$;

-- 5. Create Avatars Bucket if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Policy for avatars (Public Read)
CREATE POLICY "Avatar Public Read"
ON storage.objects FOR SELECT
USING ( bucket_id = 'avatars' );

-- Policy for avatars (User Upload)
CREATE POLICY "Avatar User Upload"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1] );

-- Policy for avatars (User Update)
CREATE POLICY "Avatar User Update"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1] );
