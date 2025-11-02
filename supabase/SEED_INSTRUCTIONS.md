# Seed Data Instructions

This guide helps you seed the database with test data for the Coupon Dispenser application.

## Prerequisites

1. **Supabase Project**: You need an active Supabase project
2. **Schema Applied**: Run `supabase/schema.sql` first to create all tables
3. **Migration Applied**: Run `supabase/migrations/remove_coupon_claim_fields.sql` to update the schema

## Step 1: Create Users in Supabase Auth

Before running the seed script, you need to create users in the Supabase Auth dashboard:

### Required Users:

1. **Admin User**
   - Email: `admin@example.com`
   - Password: `admin123`
   - Role: Will be set to `super_admin` by seed script

2. **Regular Users** (for testing)
   - Email: `user1@example.com` | Password: `user123` | Role: `user`
   - Email: `user2@example.com` | Password: `user123` | Role: `user`
   - Email: `user3@example.com` | Password: `user123` | Role: `user`

3. **Partner Admins** (optional)
   - Email: `partner1@example.com` | Password: `partner123` | Role: `partner_admin`
   - Email: `partner2@example.com` | Password: `partner123` | Role: `partner_admin`

### How to Create Users in Supabase:

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** > **Users**
3. Click **"Add User"** or **"Invite User"**
4. Enter email and password for each user
5. **Important**: Make sure "Auto Confirm User" is enabled

Alternatively, you can create users programmatically using the API:

```bash
# Using Supabase CLI (if available)
supabase auth users create user1@example.com --password user123 --auto-confirm

# Or use the Supabase Management API
```

## Step 2: Verify Users Exist in public.users Table

After creating users in Auth, they should automatically appear in `public.users` table. If not, you may need to manually insert them:

```sql
-- Check if users exist
SELECT email, role FROM public.users;

-- If admin user doesn't exist, create it (assuming auth user exists)
-- First get the auth user ID from auth.users table
INSERT INTO public.users (id, email, role)
SELECT id, email, 'super_admin'
FROM auth.users
WHERE email = 'admin@example.com'
ON CONFLICT (id) DO UPDATE SET role = 'super_admin';
```

## Step 3: Run the Seed Script

1. Open Supabase SQL Editor
2. Copy the contents of `supabase/seed-complete.sql`
3. Execute the script
4. Verify the results by checking the summary query at the end

## Step 4: Verify Seed Data

After seeding, you should have:

- **8 Vendors** (7 active, 1 inactive)
- **150+ Coupons** distributed across vendors
- **Multiple Claim History entries** showing shared coupon model
- **Users** with appropriate roles

### Test the Features:

1. **Login as admin**: `admin@example.com` / `admin123`
   - Should see all coupons and vendors
   - Can manage everything

2. **Login as user1**: `user1@example.com` / `user123`
   - Should see all coupons
   - Can claim coupons (respecting monthly limits)
   - View claim history

3. **Login as partner1**: `partner1@example.com` / `partner123`
   - Should see only SRAM Corporation vendor
   - Can manage only SRAM coupons

## Notes

- The seed script uses `ON CONFLICT` to prevent duplicates
- All coupons are created without `is_claimed` (shared model)
- Multiple users can claim the same coupon code
- Claim history shows real claim patterns
- Some users have reached monthly limits (can test limit enforcement)

## Troubleshooting

### Users not appearing in public.users
- Check if you created users in Supabase Auth
- Verify the email matches exactly
- Check Supabase logs for errors

### Foreign key errors
- Ensure vendors exist before creating coupons
- Ensure users exist before creating claim history
- Check that `created_by` user exists

### Duplicate key errors
- Seed script uses `ON CONFLICT DO NOTHING` to handle duplicates
- If you need a clean slate, uncomment the DELETE statements at the top

