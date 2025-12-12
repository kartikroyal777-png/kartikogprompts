-- 1. Safely add 'role' column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'role') THEN
        ALTER TABLE public.profiles ADD COLUMN role text DEFAULT 'user';
    END IF;
END $$;

-- 2. Safely add 'creator_badge' if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'creator_badge') THEN
        ALTER TABLE public.profiles ADD COLUMN creator_badge boolean DEFAULT false;
    END IF;
END $$;

-- 3. Handle Admin User Setup (kartikroyal777@gmail.com)
-- We cannot create a user with a password via SQL in Supabase (hashing).
-- Instead, we assume the user will sign up or already exists.
-- We create a trigger to automatically make this specific email an admin when they appear in auth.users.

CREATE OR REPLACE FUNCTION public.handle_admin_setup()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email = 'kartikroyal777@gmail.com' THEN
    UPDATE public.profiles
    SET 
      role = 'admin',
      creator_badge = true,
      display_name = 'Admin',
      is_pro = true,
      pro_badge = true
    WHERE id = NEW.id;
    
    -- Ensure they are in the creators table
    INSERT INTO public.creators (id, bio, full_access_price_credits)
    VALUES (NEW.id, 'Official OG Prompts Admin', 50)
    ON CONFLICT (id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists to avoid duplicates
DROP TRIGGER IF EXISTS on_auth_user_created_admin ON auth.users;

-- Create trigger (fires on INSERT)
CREATE TRIGGER on_auth_user_created_admin
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_admin_setup();

-- Also run an immediate update in case the user ALREADY exists
DO $$
DECLARE
  v_admin_id uuid;
BEGIN
  SELECT id INTO v_admin_id FROM auth.users WHERE email = 'kartikroyal777@gmail.com';
  
  IF v_admin_id IS NOT NULL THEN
    -- Update Profile
    UPDATE public.profiles 
    SET role = 'admin', creator_badge = true, display_name = 'Admin', is_pro = true, pro_badge = true
    WHERE id = v_admin_id;

    -- Ensure Creator Entry
    INSERT INTO public.creators (id, bio, full_access_price_credits)
    VALUES (v_admin_id, 'Official OG Prompts Admin', 50)
    ON CONFLICT (id) DO NOTHING;

    -- Update ALL existing prompts to show 'Admin' as author if they don't have a specific creator
    UPDATE public.prompts
    SET credit_name = 'Admin'
    WHERE credit_name IS NULL OR credit_name = 'Unknown';
    
    -- Optional: Link existing orphaned prompts to admin (use with caution)
    -- UPDATE public.prompts SET creator_id = v_admin_id WHERE creator_id IS NULL;
  END IF;
END $$;
