-- Migration: Add claim tracking fields to coupons table
-- This enables one-time coupon claims where each coupon can only be claimed once

-- Add claim tracking columns to coupons table
ALTER TABLE public.coupons
  ADD COLUMN IF NOT EXISTS is_claimed BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS claimed_by UUID REFERENCES public.users(id),
  ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMPTZ;

-- Update expiry_date to be calculated from claimed_at (1 month validity)
-- Note: expiry_date will be set when coupon is claimed

-- Create index for querying unclaimed coupons
CREATE INDEX IF NOT EXISTS idx_coupons_is_claimed ON public.coupons(is_claimed) WHERE is_claimed = false;
CREATE INDEX IF NOT EXISTS idx_coupons_claimed_by ON public.coupons(claimed_by);

-- Update RLS policies to handle claim status
-- Users can view unclaimed coupons
DROP POLICY IF EXISTS "Users can view unclaimed coupons" ON public.coupons;
CREATE POLICY "Users can view unclaimed coupons" ON public.coupons
  FOR SELECT USING (is_claimed = false OR deleted_at IS NOT NULL);

-- Users can view their own claimed coupons
DROP POLICY IF EXISTS "Users can view their claimed coupons" ON public.coupons;
CREATE POLICY "Users can view their claimed coupons" ON public.coupons
  FOR SELECT USING (claimed_by = auth.uid() OR deleted_at IS NOT NULL);

-- Super admins and partner admins can view all coupons (for management)
-- This policy is already covered by existing admin policies
