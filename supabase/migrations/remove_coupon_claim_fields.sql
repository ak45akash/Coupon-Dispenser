-- Migration: Remove exclusive claim fields from coupons table
-- This enables shared coupons where multiple users can claim the same coupon

-- Drop indexes related to claim fields
DROP INDEX IF EXISTS idx_coupons_is_claimed;
DROP INDEX IF EXISTS idx_coupons_claimed_by;

-- Drop RLS policies that reference is_claimed or claimed_by
DROP POLICY IF EXISTS "Users can view unclaimed coupons" ON public.coupons;
DROP POLICY IF EXISTS "Users can view their claimed coupons" ON public.coupons;

-- Remove claim-related columns from coupons table
ALTER TABLE public.coupons
  DROP COLUMN IF EXISTS is_claimed,
  DROP COLUMN IF EXISTS claimed_by,
  DROP COLUMN IF EXISTS claimed_at;

-- Create new RLS policy: All authenticated users can view all coupons
-- (claims are now tracked in claim_history, not on coupons themselves)
CREATE POLICY "Everyone can view coupons" ON public.coupons
  FOR SELECT USING (true);

-- Note: Claim tracking is now exclusively handled through claim_history table
-- Users can claim any coupon, with monthly limits enforced via claim_history

