-- Seed Claim History for Testing
-- This script creates claim history entries so you can test the UI
-- Make sure vendors and coupons exist first (run seed-complete.sql)

-- ============================================
-- CLEAR EXISTING CLAIM HISTORY (Optional)
-- ============================================
-- DELETE FROM public.claim_history;

-- ============================================
-- CREATE CLAIM HISTORY ENTRIES
-- ============================================

-- Helper function to get user ID by email
-- We'll use subqueries instead

-- Claim 1: User1 claims from Shimano (this month)
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
  AND NOT EXISTS (
    SELECT 1 FROM public.claim_history ch 
    WHERE ch.user_id = u.id 
    AND ch.coupon_id = c.id
  )
LIMIT 1;

-- Claim 2: User2 claims from Shimano (this month) - SAME COUPON as User1 (shared model)
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
  AND NOT EXISTS (
    SELECT 1 FROM public.claim_history ch 
    WHERE ch.user_id = u.id 
    AND ch.vendor_id = v.id
    AND ch.coupon_id = c.id
  )
LIMIT 1;

-- Claim 3: User3 claims from Shimano (this month) - DIFFERENT coupon
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
  AND NOT EXISTS (
    SELECT 1 FROM public.claim_history ch 
    WHERE ch.user_id = u.id 
    AND ch.coupon_id = c.id
  )
LIMIT 1;

-- Claim 4: User1 claims from SRAM (this month)
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
  AND NOT EXISTS (
    SELECT 1 FROM public.claim_history ch 
    WHERE ch.user_id = u.id 
    AND ch.coupon_id = c.id
  )
LIMIT 1;

-- Claim 5: User2 claims from Continental (this month)
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
  AND NOT EXISTS (
    SELECT 1 FROM public.claim_history ch 
    WHERE ch.user_id = u.id 
    AND ch.coupon_id = c.id
  )
LIMIT 1;

-- Claim 6: User3 claims from Continental (this month) - SAME COUPON as User2
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
  AND NOT EXISTS (
    SELECT 1 FROM public.claim_history ch 
    WHERE ch.user_id = u.id 
    AND ch.vendor_id = v.id
    AND ch.coupon_id = c.id
  )
LIMIT 1;

-- Claim 7: User1 claims from Brooks (this month)
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
  AND NOT EXISTS (
    SELECT 1 FROM public.claim_history ch 
    WHERE ch.user_id = u.id 
    AND ch.coupon_id = c.id
  )
LIMIT 1;

-- Claim 8: User2 claims from Brooks (this month) - SAME COUPON as User1
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
  AND NOT EXISTS (
    SELECT 1 FROM public.claim_history ch 
    WHERE ch.user_id = u.id 
    AND ch.vendor_id = v.id
    AND ch.coupon_id = c.id
  )
LIMIT 1;

-- Claim 9: User3 claims from Park Tool (this month)
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
  AND NOT EXISTS (
    SELECT 1 FROM public.claim_history ch 
    WHERE ch.user_id = u.id 
    AND ch.coupon_id = c.id
  )
LIMIT 1;

-- Claim 10: User1 claims from Fizik (this month)
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
  AND NOT EXISTS (
    SELECT 1 FROM public.claim_history ch 
    WHERE ch.user_id = u.id 
    AND ch.coupon_id = c.id
  )
LIMIT 1;

-- Claim 11: User2 claims from Maxxis (this month)
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
  AND NOT EXISTS (
    SELECT 1 FROM public.claim_history ch 
    WHERE ch.user_id = u.id 
    AND ch.coupon_id = c.id
  )
LIMIT 1;

-- Claim 12: User3 claims from Maxxis (this month) - SAME COUPON as User2
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
  AND NOT EXISTS (
    SELECT 1 FROM public.claim_history ch 
    WHERE ch.user_id = u.id 
    AND ch.vendor_id = v.id
    AND ch.coupon_id = c.id
  )
LIMIT 1;

-- Add more claims with different users (using existing users from your system)
-- Claim 13: Regular user (user@example.com) claims from Shimano
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
WHERE u.email = 'user@example.com'
  AND v.name = 'Shimano Components'
  AND c.code = 'SHIMANO0003'
  AND NOT EXISTS (
    SELECT 1 FROM public.claim_history ch 
    WHERE ch.user_id = u.id 
    AND ch.coupon_id = c.id
  )
LIMIT 1;

-- Claim 14: Regular user claims from SRAM
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
WHERE u.email = 'user@example.com'
  AND v.name = 'SRAM Corporation'
  AND c.code = 'SRAM0002'
  AND NOT EXISTS (
    SELECT 1 FROM public.claim_history ch 
    WHERE ch.user_id = u.id 
    AND ch.coupon_id = c.id
  )
LIMIT 1;

-- Add historical claims from last month
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
  AND c.code = 'SHIMANO0004'
  AND NOT EXISTS (
    SELECT 1 FROM public.claim_history ch 
    WHERE ch.user_id = u.id 
    AND ch.coupon_id = c.id
  )
LIMIT 1;

-- ============================================
-- SUMMARY
-- ============================================

SELECT 
  'Total Claims' as metric,
  COUNT(*)::text as value
FROM public.claim_history
UNION ALL
SELECT 
  'Claims This Month',
  COUNT(*)::text
FROM public.claim_history
WHERE DATE_TRUNC('month', claimed_at) = DATE_TRUNC('month', NOW())
UNION ALL
SELECT 
  'Unique Users with Claims',
  COUNT(DISTINCT user_id)::text
FROM public.claim_history
UNION ALL
SELECT 
  'Coupons with Claims',
  COUNT(DISTINCT coupon_id)::text
FROM public.claim_history;

