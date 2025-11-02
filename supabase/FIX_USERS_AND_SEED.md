# Quick Fix: Sync Users and Add Claim History

## Problem
- Users exist in Supabase Auth but don't appear in the app
- No claim history to test the UI

## Solution

Run these SQL scripts in order in Supabase SQL Editor:

### Step 1: Sync Users from Auth to public.users

Run `supabase/sync-users.sql`:
- This will sync all users from `auth.users` to `public.users`
- Sets appropriate roles based on email patterns
- Users will now appear in the app

### Step 2: Ensure Vendors and Coupons Exist

If you haven't run the full seed yet, run `supabase/seed-complete.sql` (or at least the vendor and coupon sections).

### Step 3: Add Claim History

Run `supabase/seed-claim-history.sql`:
- Creates claim history entries
- Multiple users claim the same coupons (shared model)
- Mix of current month and last month claims

## Quick SQL Commands

If you want to do it all at once, copy and paste this:

```sql
-- 1. Sync users
INSERT INTO public.users (id, email, name, role, created_at, updated_at)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'name', au.email) as name,
  CASE 
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

-- 2. Update specific roles
UPDATE public.users SET role = 'super_admin' WHERE email = 'admin@example.com';
UPDATE public.users SET role = 'user' WHERE email IN ('user1@example.com', 'user2@example.com', 'user3@example.com', 'user@example.com');
UPDATE public.users SET role = 'partner_admin' WHERE email LIKE '%partner%';
```

Then run `seed-claim-history.sql` separately or use the seed-complete.sql for everything.

## Verify

After running:

```sql
-- Check users
SELECT email, name, role FROM public.users WHERE deleted_at IS NULL;

-- Check claim history
SELECT 
  u.email,
  v.name as vendor,
  c.code as coupon,
  ch.claimed_at
FROM public.claim_history ch
JOIN public.users u ON ch.user_id = u.id
JOIN public.vendors v ON ch.vendor_id = v.id
JOIN public.coupons c ON ch.coupon_id = c.id
ORDER BY ch.claimed_at DESC;
```

