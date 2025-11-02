-- Sync Users from Supabase Auth to public.users table
-- Run this script to ensure all auth users appear in the app

-- ============================================
-- SYNC ALL AUTH USERS TO public.users
-- ============================================

-- Insert or update users from auth.users to public.users
INSERT INTO public.users (id, email, name, role, created_at, updated_at)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'name', au.email) as name,
  CASE 
    -- Set role based on email patterns (adjust as needed)
    WHEN au.email = 'admin@example.com' THEN 'super_admin'::user_role
    WHEN au.email LIKE '%partner%' THEN 'partner_admin'::user_role
    ELSE 'user'::user_role
  END as role,
  COALESCE(au.created_at, NOW()) as created_at,
  NOW() as updated_at
FROM auth.users au
WHERE au.deleted_at IS NULL
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = COALESCE(EXCLUDED.name, public.users.name),
  updated_at = NOW();

-- Update specific user roles if needed
UPDATE public.users 
SET role = 'super_admin' 
WHERE email = 'admin@example.com';

UPDATE public.users 
SET role = 'user' 
WHERE email IN ('user1@example.com', 'user2@example.com', 'user3@example.com', 'user@example.com');

UPDATE public.users 
SET role = 'partner_admin' 
WHERE email IN ('partner1@example.com', 'partner2@example.com', 'partner@example.com');

-- Show synced users
SELECT 
  email,
  name,
  role,
  created_at
FROM public.users
WHERE deleted_at IS NULL
ORDER BY created_at DESC;

