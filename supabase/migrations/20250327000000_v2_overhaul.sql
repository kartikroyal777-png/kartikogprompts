-- Migration for V2 Overhaul: Super Prompts, Plans, Favorites

-- 1. Update Profiles for Plans and Affiliates
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS plan_type text DEFAULT 'free'; -- 'free' or 'pro'
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referred_by uuid REFERENCES auth.users(id);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS affiliate_code text; -- Simple code for URL tracking if needed, or just use ID

-- 2. Super Prompts Schema
CREATE TABLE IF NOT EXISTS super_prompt_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  icon text, -- Lucide icon name
  description text,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS super_prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES super_prompt_categories(id) ON DELETE CASCADE,
  title text NOT NULL,
  icon text,
  what_it_does text,
  prompt_content text NOT NULL,
  how_to_use text,
  example_output_images text[], -- Array of image URLs
  is_premium boolean DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. Favorites System
CREATE TABLE IF NOT EXISTS favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  prompt_id uuid REFERENCES prompts(id) ON DELETE CASCADE,
  super_prompt_id uuid REFERENCES super_prompts(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, prompt_id),
  UNIQUE(user_id, super_prompt_id)
);

-- 4. Enable RLS
ALTER TABLE super_prompt_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE super_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- Policies for Super Prompts (Public Read, Admin Write)
CREATE POLICY "Public read super categories" ON super_prompt_categories FOR SELECT USING (true);
CREATE POLICY "Public read super prompts" ON super_prompts FOR SELECT USING (true);
CREATE POLICY "Admin all super categories" ON super_prompt_categories FOR ALL USING (
  auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
);
CREATE POLICY "Admin all super prompts" ON super_prompts FOR ALL USING (
  auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
);

-- Policies for Favorites
CREATE POLICY "Users manage own favorites" ON favorites FOR ALL USING (auth.uid() = user_id);

-- 5. Seed Initial Super Categories
INSERT INTO super_prompt_categories (name, icon, description, sort_order) VALUES
('Finance', 'DollarSign', 'Budgeting, Investing, and Financial Planning', 1),
('SEO', 'Search', 'Keyword Research, Content Strategy, and Ranking', 2),
('Solopreneurs', 'User', 'Business Strategy, MVP, and Growth', 3),
('E-Commerce', 'ShoppingBag', 'Product Descriptions, Ads, and Store Optimization', 4),
('Sales', 'TrendingUp', 'Cold Outreach, Closing, and Negotiation', 5),
('Education', 'GraduationCap', 'Lesson Plans, Study Guides, and Learning', 6),
('Productivity', 'Zap', 'Time Management, Focus, and Organization', 7),
('Writing', 'PenTool', 'Copywriting, Storytelling, and Editing', 8),
('Business', 'Briefcase', 'Strategy, Management, and Operations', 9),
('Marketing', 'Megaphone', 'Social Media, Branding, and Campaigns', 10)
ON CONFLICT DO NOTHING;

-- 6. RPC to toggle favorite
CREATE OR REPLACE FUNCTION toggle_favorite(p_prompt_id uuid, p_super_prompt_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_exists boolean;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_prompt_id IS NOT NULL THEN
    SELECT EXISTS (SELECT 1 FROM favorites WHERE user_id = v_user_id AND prompt_id = p_prompt_id) INTO v_exists;
    IF v_exists THEN
      DELETE FROM favorites WHERE user_id = v_user_id AND prompt_id = p_prompt_id;
      RETURN false;
    ELSE
      INSERT INTO favorites (user_id, prompt_id) VALUES (v_user_id, p_prompt_id);
      RETURN true;
    END IF;
  ELSIF p_super_prompt_id IS NOT NULL THEN
    SELECT EXISTS (SELECT 1 FROM favorites WHERE user_id = v_user_id AND super_prompt_id = p_super_prompt_id) INTO v_exists;
    IF v_exists THEN
      DELETE FROM favorites WHERE user_id = v_user_id AND super_prompt_id = p_super_prompt_id;
      RETURN false;
    ELSE
      INSERT INTO favorites (user_id, super_prompt_id) VALUES (v_user_id, p_super_prompt_id);
      RETURN true;
    END IF;
  END IF;
  
  RETURN false;
END;
$$;

-- 7. RPC for upgrading to Pro (Simulated Payment Success)
CREATE OR REPLACE FUNCTION upgrade_to_pro(p_user_id uuid, p_affiliate_id uuid DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update user plan
  UPDATE profiles SET plan_type = 'pro' WHERE id = p_user_id;

  -- Handle Affiliate Commission (50% of $10 plan = 5 credits/dollars)
  -- Assuming Pro Plan is $10 for calculation simplicity based on "10 credit" mention in prompt
  IF p_affiliate_id IS NOT NULL AND p_affiliate_id != p_user_id THEN
    -- Check if affiliate exists
    IF EXISTS (SELECT 1 FROM profiles WHERE id = p_affiliate_id) THEN
      -- Add credits to affiliate wallet
      -- Ensure wallet exists
      INSERT INTO wallets (user_id, balance_credits) VALUES (p_affiliate_id, 0) ON CONFLICT (user_id) DO NOTHING;
      
      -- Add 10 credits (Prompt says "when user buy pro plan then you will get 10 credit")
      UPDATE wallets 
      SET balance_credits = balance_credits + 10,
          withdrawable_credits = COALESCE(withdrawable_credits, 0) + 10,
          updated_at = now()
      WHERE user_id = p_affiliate_id;

      -- Record transaction (Optional, if transaction table exists)
      -- INSERT INTO transactions ...
    END IF;
  END IF;
END;
$$;
