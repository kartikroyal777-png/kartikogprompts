-- Fix Profiles Schema and Setup Admin
-- This migration safely adds missing columns and configures the admin user

-- 1. Fix Schema: Ensure all required columns exist in profiles
DO $$
BEGIN
    -- display_name
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'display_name') THEN
        ALTER TABLE public.profiles ADD COLUMN display_name text;
    END IF;

    -- role
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'role') THEN
        ALTER TABLE public.profiles ADD COLUMN role text DEFAULT 'user';
    END IF;

    -- creator_badge
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'creator_badge') THEN
        ALTER TABLE public.profiles ADD COLUMN creator_badge boolean DEFAULT false;
    END IF;

    -- pro_badge
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'pro_badge') THEN
        ALTER TABLE public.profiles ADD COLUMN pro_badge boolean DEFAULT false;
    END IF;

    -- is_pro
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'is_pro') THEN
        ALTER TABLE public.profiles ADD COLUMN is_pro boolean DEFAULT false;
    END IF;
END $$;

-- 2. Handle Admin User Setup
DO $$
DECLARE
    v_admin_email text := 'kartikroyal777@gmail.com';
    v_admin_id uuid;
BEGIN
    -- Try to find the user
    SELECT id INTO v_admin_id FROM auth.users WHERE email = v_admin_email;

    IF v_admin_id IS NOT NULL THEN
        -- Update Profile
        UPDATE public.profiles 
        SET 
            role = 'admin',
            creator_badge = true,
            pro_badge = true,
            is_pro = true,
            display_name = 'Admin'
        WHERE id = v_admin_id;

        -- Ensure Creator Record Exists
        INSERT INTO public.creators (id, bio, full_access_price_credits)
        VALUES (v_admin_id, 'Official Admin Account', 500)
        ON CONFLICT (id) DO NOTHING;

        -- Link "Admin" prompts to this user
        UPDATE public.prompts
        SET creator_id = v_admin_id
        WHERE creator_id IS NULL AND (credit_name ILIKE '%Admin%' OR credit_name IS NULL);
    END IF;
END $$;
