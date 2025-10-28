-- Seed Data for Coupon Dispenser
-- This script adds dummy data for testing and demonstration

-- ============================================
-- 1. CREATE ADDITIONAL USERS
-- ============================================

-- Note: For demo purposes, we'll use the admin user for all activities
-- In production, you would create actual users in Supabase Auth first,
-- then insert them into public.users with matching IDs

-- ============================================
-- 2. CREATE VENDORS (Bicycle Parts Brands)
-- ============================================

INSERT INTO public.vendors (id, name, description, website, contact_email, contact_phone, active, created_by)
VALUES 
  (
    gen_random_uuid(),
    'Shimano Components',
    'World leader in bicycle components, drivetrain systems, and cycling gear',
    'https://shimano.com',
    'support@shimano.com',
    '+1-949-951-5003',
    true,
    (SELECT id FROM public.users WHERE email = 'admin@example.com')
  ),
  (
    gen_random_uuid(),
    'SRAM Corporation',
    'Premium bicycle components, groupsets, and drivetrain systems',
    'https://sram.com',
    'service@sram.com',
    '+1-312-664-8800',
    true,
    (SELECT id FROM public.users WHERE email = 'admin@example.com')
  ),
  (
    gen_random_uuid(),
    'Continental Tires',
    'High-performance bicycle tires for road, mountain, and gravel bikes',
    'https://continental-tires.com',
    'info@conti-bikes.com',
    '+1-888-799-2550',
    true,
    (SELECT id FROM public.users WHERE email = 'admin@example.com')
  ),
  (
    gen_random_uuid(),
    'Brooks England',
    'Handcrafted leather saddles and cycling accessories since 1866',
    'https://brooksengland.com',
    'contact@brooksengland.com',
    '+44-121-369-6868',
    true,
    (SELECT id FROM public.users WHERE email = 'admin@example.com')
  ),
  (
    gen_random_uuid(),
    'Park Tool Company',
    'Professional bicycle tools and workshop equipment',
    'https://parktool.com',
    'help@parktool.com',
    '+1-651-777-6868',
    true,
    (SELECT id FROM public.users WHERE email = 'admin@example.com')
  ),
  (
    gen_random_uuid(),
    'Maxxis International',
    'Premium bicycle tires for mountain, road, and BMX',
    'https://maxxis.com',
    'cycling@maxxis.com',
    '+1-770-781-2900',
    true,
    (SELECT id FROM public.users WHERE email = 'admin@example.com')
  ),
  (
    gen_random_uuid(),
    'Fizik Saddles',
    'Italian performance saddles and cycling accessories',
    'https://fizik.com',
    'info@fizik.com',
    '+39-0423-5285',
    true,
    (SELECT id FROM public.users WHERE email = 'admin@example.com')
  ),
  (
    gen_random_uuid(),
    'RockShox Suspension',
    'Mountain bike suspension forks and rear shocks',
    'https://rockshox.com',
    'support@rockshox.com',
    '+1-888-472-6636',
    false,
    (SELECT id FROM public.users WHERE email = 'admin@example.com')
  );

-- ============================================
-- 3. CREATE COUPONS FOR EACH VENDOR (Bicycle Parts)
-- ============================================

-- Shimano Components Coupons
INSERT INTO public.coupons (vendor_id, code, description, discount_value, expiry_date, is_claimed, created_by)
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
  false,
  (SELECT id FROM public.users WHERE email = 'admin@example.com')
FROM public.vendors v
CROSS JOIN generate_series(1, 25) AS s(num)
WHERE v.name = 'Shimano Components';

-- SRAM Corporation Coupons
INSERT INTO public.coupons (vendor_id, code, description, discount_value, expiry_date, is_claimed, created_by)
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
  false,
  (SELECT id FROM public.users WHERE email = 'admin@example.com')
FROM public.vendors v
CROSS JOIN generate_series(1, 20) AS s(num)
WHERE v.name = 'SRAM Corporation';

-- Continental Tires Coupons
INSERT INTO public.coupons (vendor_id, code, description, discount_value, expiry_date, is_claimed, created_by)
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
  false,
  (SELECT id FROM public.users WHERE email = 'admin@example.com')
FROM public.vendors v
CROSS JOIN generate_series(1, 30) AS s(num)
WHERE v.name = 'Continental Tires';

-- Brooks England Coupons
INSERT INTO public.coupons (vendor_id, code, description, discount_value, expiry_date, is_claimed, created_by)
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
  false,
  (SELECT id FROM public.users WHERE email = 'admin@example.com')
FROM public.vendors v
CROSS JOIN generate_series(1, 18) AS s(num)
WHERE v.name = 'Brooks England';

-- Park Tool Company Coupons
INSERT INTO public.coupons (vendor_id, code, description, discount_value, expiry_date, is_claimed, created_by)
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
  false,
  (SELECT id FROM public.users WHERE email = 'admin@example.com')
FROM public.vendors v
CROSS JOIN generate_series(1, 15) AS s(num)
WHERE v.name = 'Park Tool Company';

-- Maxxis International Coupons
INSERT INTO public.coupons (vendor_id, code, description, discount_value, expiry_date, is_claimed, created_by)
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
  false,
  (SELECT id FROM public.users WHERE email = 'admin@example.com')
FROM public.vendors v
CROSS JOIN generate_series(1, 12) AS s(num)
WHERE v.name = 'Maxxis International';

-- Fizik Saddles Coupons
INSERT INTO public.coupons (vendor_id, code, description, discount_value, expiry_date, is_claimed, created_by)
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
  false,
  (SELECT id FROM public.users WHERE email = 'admin@example.com')
FROM public.vendors v
CROSS JOIN generate_series(1, 20) AS s(num)
WHERE v.name = 'Fizik Saddles';

-- RockShox Suspension Coupons (inactive vendor)
INSERT INTO public.coupons (vendor_id, code, description, discount_value, expiry_date, is_claimed, created_by)
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
  false,
  (SELECT id FROM public.users WHERE email = 'admin@example.com')
FROM public.vendors v
CROSS JOIN generate_series(1, 10) AS s(num)
WHERE v.name = 'RockShox Suspension';

-- ============================================
-- 4. SIMULATE SOME CLAIMED COUPONS
-- ============================================

-- For demo purposes, we'll claim some coupons using the admin user
-- In production, these would be claimed by actual registered users

-- Claim some Shimano coupons
WITH claimed_coupons AS (
  UPDATE public.coupons
  SET 
    is_claimed = true,
    claimed_by = (SELECT id FROM public.users WHERE email = 'admin@example.com' LIMIT 1),
    claimed_at = NOW() - INTERVAL '5 days'
  WHERE id IN (
    SELECT id FROM public.coupons 
    WHERE vendor_id = (SELECT id FROM public.vendors WHERE name = 'Shimano Components')
    AND is_claimed = false
    LIMIT 3
  )
  RETURNING id, vendor_id, claimed_by, claimed_at
)
INSERT INTO public.claim_history (user_id, vendor_id, coupon_id, claimed_at, claim_month)
SELECT 
  claimed_by,
  vendor_id,
  id,
  claimed_at,
  DATE_TRUNC('month', claimed_at)::DATE
FROM claimed_coupons;

-- Claim some SRAM coupons
WITH claimed_coupons AS (
  UPDATE public.coupons
  SET 
    is_claimed = true,
    claimed_by = (SELECT id FROM public.users WHERE email = 'admin@example.com' LIMIT 1),
    claimed_at = NOW() - INTERVAL '10 days'
  WHERE id IN (
    SELECT id FROM public.coupons 
    WHERE vendor_id = (SELECT id FROM public.vendors WHERE name = 'SRAM Corporation')
    AND is_claimed = false
    LIMIT 2
  )
  RETURNING id, vendor_id, claimed_by, claimed_at
)
INSERT INTO public.claim_history (user_id, vendor_id, coupon_id, claimed_at, claim_month)
SELECT 
  claimed_by,
  vendor_id,
  id,
  claimed_at,
  DATE_TRUNC('month', claimed_at)::DATE
FROM claimed_coupons;

-- Claim some Continental Tires coupons
WITH claimed_coupons AS (
  UPDATE public.coupons
  SET 
    is_claimed = true,
    claimed_by = (SELECT id FROM public.users WHERE email = 'admin@example.com' LIMIT 1),
    claimed_at = NOW() - INTERVAL '3 days'
  WHERE id IN (
    SELECT id FROM public.coupons 
    WHERE vendor_id = (SELECT id FROM public.vendors WHERE name = 'Continental Tires')
    AND is_claimed = false
    LIMIT 5
  )
  RETURNING id, vendor_id, claimed_by, claimed_at
)
INSERT INTO public.claim_history (user_id, vendor_id, coupon_id, claimed_at, claim_month)
SELECT 
  claimed_by,
  vendor_id,
  id,
  claimed_at,
  DATE_TRUNC('month', claimed_at)::DATE
FROM claimed_coupons;

-- Claim some Brooks England coupons
WITH claimed_coupons AS (
  UPDATE public.coupons
  SET 
    is_claimed = true,
    claimed_by = (SELECT id FROM public.users WHERE email = 'admin@example.com' LIMIT 1),
    claimed_at = NOW() - INTERVAL '7 days'
  WHERE id IN (
    SELECT id FROM public.coupons 
    WHERE vendor_id = (SELECT id FROM public.vendors WHERE name = 'Brooks England')
    AND is_claimed = false
    LIMIT 2
  )
  RETURNING id, vendor_id, claimed_by, claimed_at
)
INSERT INTO public.claim_history (user_id, vendor_id, coupon_id, claimed_at, claim_month)
SELECT 
  claimed_by,
  vendor_id,
  id,
  claimed_at,
  DATE_TRUNC('month', claimed_at)::DATE
FROM claimed_coupons;

-- Claim some Park Tool coupons
WITH claimed_coupons AS (
  UPDATE public.coupons
  SET 
    is_claimed = true,
    claimed_by = (SELECT id FROM public.users WHERE email = 'admin@example.com' LIMIT 1),
    claimed_at = NOW() - INTERVAL '12 days'
  WHERE id IN (
    SELECT id FROM public.coupons 
    WHERE vendor_id = (SELECT id FROM public.vendors WHERE name = 'Park Tool Company')
    AND is_claimed = false
    LIMIT 3
  )
  RETURNING id, vendor_id, claimed_by, claimed_at
)
INSERT INTO public.claim_history (user_id, vendor_id, coupon_id, claimed_at, claim_month)
SELECT 
  claimed_by,
  vendor_id,
  id,
  claimed_at,
  DATE_TRUNC('month', claimed_at)::DATE
FROM claimed_coupons;

-- Claim some Fizik coupons
WITH claimed_coupons AS (
  UPDATE public.coupons
  SET 
    is_claimed = true,
    claimed_by = (SELECT id FROM public.users WHERE email = 'admin@example.com' LIMIT 1),
    claimed_at = NOW() - INTERVAL '2 days'
  WHERE id IN (
    SELECT id FROM public.coupons 
    WHERE vendor_id = (SELECT id FROM public.vendors WHERE name = 'Fizik Saddles')
    AND is_claimed = false
    LIMIT 1
  )
  RETURNING id, vendor_id, claimed_by, claimed_at
)
INSERT INTO public.claim_history (user_id, vendor_id, coupon_id, claimed_at, claim_month)
SELECT 
  claimed_by,
  vendor_id,
  id,
  claimed_at,
  DATE_TRUNC('month', claimed_at)::DATE
FROM claimed_coupons;

-- ============================================
-- 5. ASSIGN PARTNER ADMIN TO VENDORS
-- ============================================

-- Note: Partner admin assignment would go here
-- First create a partner admin user in Supabase Auth, then assign them to vendors
-- Example:
-- INSERT INTO public.partner_vendor_access (user_id, vendor_id)
-- SELECT 
--   (SELECT id FROM public.users WHERE email = 'partner@example.com'),
--   id
-- FROM public.vendors
-- WHERE name IN ('SRAM Corporation', 'Fizik Saddles')
-- ON CONFLICT (user_id, vendor_id) DO NOTHING;

-- ============================================
-- SUMMARY QUERY
-- ============================================

-- View the data we just created
SELECT 
  'Vendors' as table_name,
  COUNT(*) as count
FROM public.vendors
UNION ALL
SELECT 
  'Coupons',
  COUNT(*)
FROM public.coupons
UNION ALL
SELECT 
  'Claimed Coupons',
  COUNT(*)
FROM public.coupons
WHERE is_claimed = true
UNION ALL
SELECT 
  'Users',
  COUNT(*)
FROM public.users
UNION ALL
SELECT 
  'Claim History',
  COUNT(*)
FROM public.claim_history;

