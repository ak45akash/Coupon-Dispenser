-- Complete Seed Data for Coupon Dispenser
-- This script creates comprehensive test data with users, vendors, coupons, and claim history
-- NOTE: Users must be created in Supabase Auth first, then linked here

-- ============================================
-- IMPORTANT: Before running this script
-- ============================================
-- 1. Create users in Supabase Auth Dashboard:
--    - admin@example.com (password: admin123)
--    - user1@example.com (password: user123)
--    - user2@example.com (password: user123)
--    - user3@example.com (password: user123)
--    - partner1@example.com (password: partner123)
--    - partner2@example.com (password: partner123)
--
-- 2. After creating users in Auth, their IDs will be automatically synced to public.users
--    If not, you may need to manually insert them or run the schema.sql first

-- ============================================
-- CLEAN EXISTING DATA (Optional - use with caution)
-- ============================================
-- Uncomment to clear existing data before seeding:
-- DELETE FROM public.claim_history;
-- DELETE FROM public.partner_vendor_access;
-- DELETE FROM public.coupons;
-- DELETE FROM public.vendors;

-- ============================================
-- 1. ENSURE ADMIN USER EXISTS
-- ============================================
-- Update admin user role if exists
UPDATE public.users 
SET role = 'super_admin' 
WHERE email = 'admin@example.com' AND role != 'super_admin';

-- ============================================
-- 2. CREATE/USPDATE REGULAR USERS
-- ============================================
-- These should already exist from Supabase Auth, but update their roles
UPDATE public.users 
SET role = 'user' 
WHERE email IN ('user1@example.com', 'user2@example.com', 'user3@example.com')
  AND role != 'user';

-- ============================================
-- 3. CREATE/USPDATE PARTNER ADMINS
-- ============================================
UPDATE public.users 
SET role = 'partner_admin' 
WHERE email IN ('partner1@example.com', 'partner2@example.com')
  AND role != 'partner_admin';

-- ============================================
-- 4. CREATE VENDORS (Bicycle Parts Brands)
-- ============================================

-- Delete existing vendors and recreate (to ensure clean slate)
DELETE FROM public.vendors WHERE name IN (
  'Shimano Components',
  'SRAM Corporation',
  'Continental Tires',
  'Brooks England',
  'Park Tool Company',
  'Maxxis International',
  'Fizik Saddles',
  'RockShox Suspension'
);

INSERT INTO public.vendors (id, name, description, website, contact_email, contact_phone, active, created_by)
SELECT 
  gen_random_uuid(),
  vendor_data.name,
  vendor_data.description,
  vendor_data.website,
  vendor_data.contact_email,
  vendor_data.contact_phone,
  vendor_data.active,
  (SELECT id FROM public.users WHERE email = 'admin@example.com' LIMIT 1)
FROM (VALUES
  (
    'Shimano Components',
    'World leader in bicycle components, drivetrain systems, and cycling gear',
    'https://shimano.com',
    'support@shimano.com',
    '+1-949-951-5003',
    true
  ),
  (
    'SRAM Corporation',
    'Premium bicycle components, groupsets, and drivetrain systems',
    'https://sram.com',
    'service@sram.com',
    '+1-312-664-8800',
    true
  ),
  (
    'Continental Tires',
    'High-performance bicycle tires for road, mountain, and gravel bikes',
    'https://continental-tires.com',
    'info@conti-bikes.com',
    '+1-888-799-2550',
    true
  ),
  (
    'Brooks England',
    'Handcrafted leather saddles and cycling accessories since 1866',
    'https://brooksengland.com',
    'contact@brooksengland.com',
    '+44-121-369-6868',
    true
  ),
  (
    'Park Tool Company',
    'Professional bicycle tools and workshop equipment',
    'https://parktool.com',
    'help@parktool.com',
    '+1-651-777-6868',
    true
  ),
  (
    'Maxxis International',
    'Premium bicycle tires for mountain, road, and BMX',
    'https://maxxis.com',
    'cycling@maxxis.com',
    '+1-770-781-2900',
    true
  ),
  (
    'Fizik Saddles',
    'Italian performance saddles and cycling accessories',
    'https://fizik.com',
    'info@fizik.com',
    '+39-0423-5285',
    true
  ),
  (
    'RockShox Suspension',
    'Mountain bike suspension forks and rear shocks',
    'https://rockshox.com',
    'support@rockshox.com',
    '+1-888-472-6636',
    false
  )
) AS vendor_data(name, description, website, contact_email, contact_phone, active)
ON CONFLICT DO NOTHING;

-- ============================================
-- 5. ASSIGN PARTNER ADMINS TO VENDORS
-- ============================================

-- Assign partner1 to SRAM Corporation
INSERT INTO public.partner_vendor_access (user_id, vendor_id)
SELECT 
  u.id,
  v.id
FROM public.users u
CROSS JOIN public.vendors v
WHERE u.email = 'partner1@example.com'
  AND v.name = 'SRAM Corporation'
ON CONFLICT (user_id, vendor_id) DO NOTHING;

-- Assign partner2 to Fizik Saddles
INSERT INTO public.partner_vendor_access (user_id, vendor_id)
SELECT 
  u.id,
  v.id
FROM public.users u
CROSS JOIN public.vendors v
WHERE u.email = 'partner2@example.com'
  AND v.name = 'Fizik Saddles'
ON CONFLICT (user_id, vendor_id) DO NOTHING;

-- ============================================
-- 6. CREATE COUPONS (Shared Model - No is_claimed)
-- ============================================

-- Delete existing coupons to start fresh
DELETE FROM public.coupons;

-- Shimano Components Coupons (25 coupons)
INSERT INTO public.coupons (vendor_id, code, description, discount_value, expiry_date, created_by)
SELECT 
  v.id,
  'SHIMANO' || LPAD(s.num::TEXT, 4, '0'),
  CASE s.num % 5
    WHEN 0 THEN 'Discount on Ultegra groupset components'
    WHEN 1 THEN 'Save on Dura-Ace cranksets and derailleurs'
    WHEN 2 THEN 'Deore XT drivetrain parts on sale'
    WHEN 3 THEN 'Discount on SPD clipless pedals'
    ELSE '105 series brake calipers and shifters'
  END,
  CASE 
    WHEN s.num % 3 = 0 THEN '20% off'
    WHEN s.num % 3 = 1 THEN '15% off'
    ELSE '$25 off'
  END,
  NOW() + INTERVAL '90 days',
  (SELECT id FROM public.users WHERE email = 'admin@example.com' LIMIT 1)
FROM public.vendors v
CROSS JOIN generate_series(1, 25) AS s(num)
WHERE v.name = 'Shimano Components'
ON CONFLICT (code) DO NOTHING;

-- SRAM Corporation Coupons (20 coupons)
INSERT INTO public.coupons (vendor_id, code, description, discount_value, expiry_date, created_by)
SELECT 
  v.id,
  'SRAM' || LPAD(s.num::TEXT, 4, '0'),
  CASE s.num % 4
    WHEN 0 THEN 'GX Eagle 12-speed groupset discount'
    WHEN 1 THEN 'Save on Red eTap AXS wireless shifting'
    WHEN 2 THEN 'XX1 Eagle cassette and chain deal'
    ELSE 'Rival groupset components on sale'
  END,
  CASE 
    WHEN s.num % 2 = 0 THEN '$50 off'
    ELSE '25% off'
  END,
  NOW() + INTERVAL '60 days',
  (SELECT id FROM public.users WHERE email = 'admin@example.com' LIMIT 1)
FROM public.vendors v
CROSS JOIN generate_series(1, 20) AS s(num)
WHERE v.name = 'SRAM Corporation'
ON CONFLICT (code) DO NOTHING;

-- Continental Tires Coupons (30 coupons)
INSERT INTO public.coupons (vendor_id, code, description, discount_value, expiry_date, created_by)
SELECT 
  v.id,
  'CONTI' || LPAD(s.num::TEXT, 4, '0'),
  CASE s.num % 6
    WHEN 0 THEN 'Grand Prix 5000 road tires discount'
    WHEN 1 THEN 'Save on Mountain King MTB tires'
    WHEN 2 THEN 'Terra Trail gravel tires on sale'
    WHEN 3 THEN 'Gatorskin puncture-resistant tire deal'
    WHEN 4 THEN 'X-King 29er mountain bike tires'
    ELSE 'Race King cyclocross tire discount'
  END,
  CASE 
    WHEN s.num % 4 = 0 THEN '$15 off per tire'
    WHEN s.num % 4 = 1 THEN '30% off'
    WHEN s.num % 4 = 2 THEN 'Buy 1 Get 1 50% off'
    ELSE '$20 off pair'
  END,
  NOW() + INTERVAL '45 days',
  (SELECT id FROM public.users WHERE email = 'admin@example.com' LIMIT 1)
FROM public.vendors v
CROSS JOIN generate_series(1, 30) AS s(num)
WHERE v.name = 'Continental Tires'
ON CONFLICT (code) DO NOTHING;

-- Brooks England Coupons (18 coupons)
INSERT INTO public.coupons (vendor_id, code, description, discount_value, expiry_date, created_by)
SELECT 
  v.id,
  'BROOKS' || LPAD(s.num::TEXT, 4, '0'),
  CASE s.num % 5
    WHEN 0 THEN 'B17 leather saddle discount'
    WHEN 1 THEN 'Save on Cambium C17 carved saddle'
    WHEN 2 THEN 'England handlebar tape and grips'
    WHEN 3 THEN 'Swift saddle special offer'
    ELSE 'Leather handlebar tape discount'
  END,
  CASE 
    WHEN s.num % 3 = 0 THEN '$30 off'
    WHEN s.num % 3 = 1 THEN '20% off'
    ELSE '$25 off'
  END,
  NOW() + INTERVAL '60 days',
  (SELECT id FROM public.users WHERE email = 'admin@example.com' LIMIT 1)
FROM public.vendors v
CROSS JOIN generate_series(1, 18) AS s(num)
WHERE v.name = 'Brooks England'
ON CONFLICT (code) DO NOTHING;

-- Park Tool Company Coupons (15 coupons)
INSERT INTO public.coupons (vendor_id, code, description, discount_value, expiry_date, created_by)
SELECT 
  v.id,
  'PARKTOOL' || LPAD(s.num::TEXT, 3, '0'),
  CASE s.num % 5
    WHEN 0 THEN 'Professional bike repair stand discount'
    WHEN 1 THEN 'Save on chain checker and cleaning tools'
    WHEN 2 THEN 'Torque wrench set special offer'
    WHEN 3 THEN 'Complete home mechanic tool kit'
    ELSE 'Bottom bracket and headset tools'
  END,
  CASE 
    WHEN s.num % 2 = 0 THEN '15% off'
    ELSE '$20 off'
  END,
  NOW() + INTERVAL '90 days',
  (SELECT id FROM public.users WHERE email = 'admin@example.com' LIMIT 1)
FROM public.vendors v
CROSS JOIN generate_series(1, 15) AS s(num)
WHERE v.name = 'Park Tool Company'
ON CONFLICT (code) DO NOTHING;

-- Maxxis International Coupons (12 coupons)
INSERT INTO public.coupons (vendor_id, code, description, discount_value, expiry_date, created_by)
SELECT 
  v.id,
  'MAXXIS' || LPAD(s.num::TEXT, 3, '0'),
  CASE s.num % 4
    WHEN 0 THEN 'Minion DHF downhill tire discount'
    WHEN 1 THEN 'Save on Ardent mountain bike tires'
    WHEN 2 THEN 'High Roller II trail tire deal'
    ELSE 'Ikon XC race tire special'
  END,
  CASE 
    WHEN s.num % 3 = 0 THEN '$18 off per tire'
    WHEN s.num % 3 = 1 THEN '25% off'
    ELSE 'Buy 2 Get $10 off'
  END,
  NOW() + INTERVAL '45 days',
  (SELECT id FROM public.users WHERE email = 'admin@example.com' LIMIT 1)
FROM public.vendors v
CROSS JOIN generate_series(1, 12) AS s(num)
WHERE v.name = 'Maxxis International'
ON CONFLICT (code) DO NOTHING;

-- Fizik Saddles Coupons (20 coupons)
INSERT INTO public.coupons (vendor_id, code, description, discount_value, expiry_date, created_by)
SELECT 
  v.id,
  'FIZIK' || LPAD(s.num::TEXT, 4, '0'),
  CASE s.num % 5
    WHEN 0 THEN 'Antares R1 carbon rail saddle'
    WHEN 1 THEN 'Save on Aliante performance saddle'
    WHEN 2 THEN 'Arione R3 race saddle discount'
    WHEN 3 THEN 'Tempo Argo R5 short-nose saddle'
    ELSE 'Bar tape and handlebar accessories'
  END,
  CASE 
    WHEN s.num % 2 = 0 THEN '$40 off'
    ELSE '30% off'
  END,
  NOW() + INTERVAL '60 days',
  (SELECT id FROM public.users WHERE email = 'admin@example.com' LIMIT 1)
FROM public.vendors v
CROSS JOIN generate_series(1, 20) AS s(num)
WHERE v.name = 'Fizik Saddles'
ON CONFLICT (code) DO NOTHING;

-- RockShox Suspension Coupons (10 coupons - inactive vendor)
INSERT INTO public.coupons (vendor_id, code, description, discount_value, expiry_date, created_by)
SELECT 
  v.id,
  'ROCKSHOX' || LPAD(s.num::TEXT, 3, '0'),
  CASE s.num % 3
    WHEN 0 THEN 'Pike Ultimate fork service discount'
    WHEN 1 THEN 'Save on Reverb dropper seatpost'
    ELSE 'Super Deluxe rear shock special'
  END,
  CASE 
    WHEN s.num % 2 = 0 THEN '$75 off'
    ELSE '20% off'
  END,
  NOW() + INTERVAL '30 days',
  (SELECT id FROM public.users WHERE email = 'admin@example.com' LIMIT 1)
FROM public.vendors v
CROSS JOIN generate_series(1, 10) AS s(num)
WHERE v.name = 'RockShox Suspension'
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- 7. CREATE CLAIM HISTORY (Multiple Users Claiming)
-- ============================================
-- This demonstrates the shared coupon model where multiple users can claim the same coupon

-- Clear existing claim history
DELETE FROM public.claim_history;

-- User1 claims from Shimano (this month)
INSERT INTO public.claim_history (user_id, vendor_id, coupon_id, claimed_at, claim_month)
SELECT 
  u.id,
  v.id,
  c.id,
  NOW() - INTERVAL '2 days',
  DATE_TRUNC('month', NOW())::DATE
FROM public.users u
CROSS JOIN public.vendors v
CROSS JOIN public.coupons c
WHERE u.email = 'user1@example.com'
  AND v.name = 'Shimano Components'
  AND c.code = 'SHIMANO0001'
LIMIT 1;

-- User2 claims from Shimano (this month) - SAME COUPON as User1
INSERT INTO public.claim_history (user_id, vendor_id, coupon_id, claimed_at, claim_month)
SELECT 
  u.id,
  v.id,
  c.id,
  NOW() - INTERVAL '1 day',
  DATE_TRUNC('month', NOW())::DATE
FROM public.users u
CROSS JOIN public.vendors v
CROSS JOIN public.coupons c
WHERE u.email = 'user2@example.com'
  AND v.name = 'Shimano Components'
  AND c.code = 'SHIMANO0001'  -- Same coupon!
LIMIT 1;

-- User3 claims from Shimano (this month) - DIFFERENT coupon
INSERT INTO public.claim_history (user_id, vendor_id, coupon_id, claimed_at, claim_month)
SELECT 
  u.id,
  v.id,
  c.id,
  NOW() - INTERVAL '3 days',
  DATE_TRUNC('month', NOW())::DATE
FROM public.users u
CROSS JOIN public.vendors v
CROSS JOIN public.coupons c
WHERE u.email = 'user3@example.com'
  AND v.name = 'Shimano Components'
  AND c.code = 'SHIMANO0002'
LIMIT 1;

-- User1 claims from SRAM (this month)
INSERT INTO public.claim_history (user_id, vendor_id, coupon_id, claimed_at, claim_month)
SELECT 
  u.id,
  v.id,
  c.id,
  NOW() - INTERVAL '5 days',
  DATE_TRUNC('month', NOW())::DATE
FROM public.users u
CROSS JOIN public.vendors v
CROSS JOIN public.coupons c
WHERE u.email = 'user1@example.com'
  AND v.name = 'SRAM Corporation'
  AND c.code = 'SRAM0001'
LIMIT 1;

-- User2 claims from Continental (this month)
INSERT INTO public.claim_history (user_id, vendor_id, coupon_id, claimed_at, claim_month)
SELECT 
  u.id,
  v.id,
  c.id,
  NOW() - INTERVAL '4 days',
  DATE_TRUNC('month', NOW())::DATE
FROM public.users u
CROSS JOIN public.vendors v
CROSS JOIN public.coupons c
WHERE u.email = 'user2@example.com'
  AND v.name = 'Continental Tires'
  AND c.code = 'CONTI0001'
LIMIT 1;

-- User3 claims from Continental (this month) - SAME COUPON as User2
INSERT INTO public.claim_history (user_id, vendor_id, coupon_id, claimed_at, claim_month)
SELECT 
  u.id,
  v.id,
  c.id,
  NOW() - INTERVAL '6 hours',
  DATE_TRUNC('month', NOW())::DATE
FROM public.users u
CROSS JOIN public.vendors v
CROSS JOIN public.coupons c
WHERE u.email = 'user3@example.com'
  AND v.name = 'Continental Tires'
  AND c.code = 'CONTI0001'  -- Same coupon!
LIMIT 1;

-- User1 claims from Brooks (this month)
INSERT INTO public.claim_history (user_id, vendor_id, coupon_id, claimed_at, claim_month)
SELECT 
  u.id,
  v.id,
  c.id,
  NOW() - INTERVAL '7 days',
  DATE_TRUNC('month', NOW())::DATE
FROM public.users u
CROSS JOIN public.vendors v
CROSS JOIN public.coupons c
WHERE u.email = 'user1@example.com'
  AND v.name = 'Brooks England'
  AND c.code = 'BROOKS0001'
LIMIT 1;

-- User2 claims from Brooks (this month) - SAME COUPON as User1
INSERT INTO public.claim_history (user_id, vendor_id, coupon_id, claimed_at, claim_month)
SELECT 
  u.id,
  v.id,
  c.id,
  NOW() - INTERVAL '1 day',
  DATE_TRUNC('month', NOW())::DATE
FROM public.users u
CROSS JOIN public.vendors v
CROSS JOIN public.coupons c
WHERE u.email = 'user2@example.com'
  AND v.name = 'Brooks England'
  AND c.code = 'BROOKS0001'  -- Same coupon!
LIMIT 1;

-- User3 claims from Park Tool (this month)
INSERT INTO public.claim_history (user_id, vendor_id, coupon_id, claimed_at, claim_month)
SELECT 
  u.id,
  v.id,
  c.id,
  NOW() - INTERVAL '10 days',
  DATE_TRUNC('month', NOW())::DATE
FROM public.users u
CROSS JOIN public.vendors v
CROSS JOIN public.coupons c
WHERE u.email = 'user3@example.com'
  AND v.name = 'Park Tool Company'
  AND c.code = 'PARKTOOL001'
LIMIT 1;

-- User1 claims from Fizik (this month)
INSERT INTO public.claim_history (user_id, vendor_id, coupon_id, claimed_at, claim_month)
SELECT 
  u.id,
  v.id,
  c.id,
  NOW() - INTERVAL '12 days',
  DATE_TRUNC('month', NOW())::DATE
FROM public.users u
CROSS JOIN public.vendors v
CROSS JOIN public.coupons c
WHERE u.email = 'user1@example.com'
  AND v.name = 'Fizik Saddles'
  AND c.code = 'FIZIK0001'
LIMIT 1;

-- User2 claims from Maxxis (this month)
INSERT INTO public.claim_history (user_id, vendor_id, coupon_id, claimed_at, claim_month)
SELECT 
  u.id,
  v.id,
  c.id,
  NOW() - INTERVAL '8 days',
  DATE_TRUNC('month', NOW())::DATE
FROM public.users u
CROSS JOIN public.vendors v
CROSS JOIN public.coupons c
WHERE u.email = 'user2@example.com'
  AND v.name = 'Maxxis International'
  AND c.code = 'MAXXIS001'
LIMIT 1;

-- User3 claims from Maxxis (this month) - SAME COUPON as User2
INSERT INTO public.claim_history (user_id, vendor_id, coupon_id, claimed_at, claim_month)
SELECT 
  u.id,
  v.id,
  c.id,
  NOW() - INTERVAL '2 hours',
  DATE_TRUNC('month', NOW())::DATE
FROM public.users u
CROSS JOIN public.vendors v
CROSS JOIN public.coupons c
WHERE u.email = 'user3@example.com'
  AND v.name = 'Maxxis International'
  AND c.code = 'MAXXIS001'  -- Same coupon!
LIMIT 1;

-- Add some historical claims from last month (to test monthly limits)
INSERT INTO public.claim_history (user_id, vendor_id, coupon_id, claimed_at, claim_month)
SELECT 
  u.id,
  v.id,
  c.id,
  NOW() - INTERVAL '35 days',  -- Last month
  DATE_TRUNC('month', NOW() - INTERVAL '1 month')::DATE
FROM public.users u
CROSS JOIN public.vendors v
CROSS JOIN public.coupons c
WHERE u.email = 'user1@example.com'
  AND v.name = 'Shimano Components'
  AND c.code = 'SHIMANO0003'
LIMIT 1;

INSERT INTO public.claim_history (user_id, vendor_id, coupon_id, claimed_at, claim_month)
SELECT 
  u.id,
  v.id,
  c.id,
  NOW() - INTERVAL '32 days',  -- Last month
  DATE_TRUNC('month', NOW() - INTERVAL '1 month')::DATE
FROM public.users u
CROSS JOIN public.vendors v
CROSS JOIN public.coupons c
WHERE u.email = 'user2@example.com'
  AND v.name = 'SRAM Corporation'
  AND c.code = 'SRAM0002'
LIMIT 1;

-- ============================================
-- 8. SUMMARY QUERY
-- ============================================

SELECT 
  'Vendors' as table_name,
  COUNT(*) as count
FROM public.vendors
WHERE deleted_at IS NULL
UNION ALL
SELECT 
  'Active Coupons',
  COUNT(*)
FROM public.coupons
WHERE deleted_at IS NULL
UNION ALL
SELECT 
  'Total Claim History',
  COUNT(*)
FROM public.claim_history
UNION ALL
SELECT 
  'Users',
  COUNT(*)
FROM public.users
WHERE deleted_at IS NULL
UNION ALL
SELECT 
  'Claims This Month',
  COUNT(*)
FROM public.claim_history
WHERE DATE_TRUNC('month', claimed_at) = DATE_TRUNC('month', NOW());

