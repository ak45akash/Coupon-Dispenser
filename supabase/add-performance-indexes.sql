-- Additional performance indexes for optimization
-- Run this script to add missing indexes for better query performance

-- Add missing index on coupon_id in claim_history
CREATE INDEX IF NOT EXISTS idx_claim_history_coupon_id ON public.claim_history(coupon_id);

-- Add index on vendor_id in claim_history for better join performance
CREATE INDEX IF NOT EXISTS idx_claim_history_vendor_id_coupon ON public.claim_history(vendor_id, coupon_id);

-- Add indexes on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_users_created_at ON public.users(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vendors_created_at ON public.vendors(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_coupons_created_at ON public.coupons(created_at DESC);

-- Add partial index on active vendors
CREATE INDEX IF NOT EXISTS idx_vendors_active ON public.vendors(active) WHERE active = true;

-- Add index on email for quick user lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- Add index on code for quick coupon lookups
CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons(code);

-- Add index on claim_history.claimed_at for time-based queries
CREATE INDEX IF NOT EXISTS idx_claim_history_claimed_at ON public.claim_history(claimed_at DESC);

-- Add indexes for soft delete queries (if not already exists)
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON public.users(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_vendors_deleted_at ON public.vendors(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_coupons_deleted_at ON public.coupons(deleted_at) WHERE deleted_at IS NOT NULL;

-- Add index on expiry_date for filtering expired coupons
CREATE INDEX IF NOT EXISTS idx_coupons_expiry_date ON public.coupons(expiry_date);

-- Composite index for common vendor queries
CREATE INDEX IF NOT EXISTS idx_vendors_active_created ON public.vendors(active, created_at DESC) WHERE deleted_at IS NULL;

-- Composite index for coupon lookups by vendor and expiry
CREATE INDEX IF NOT EXISTS idx_coupons_vendor_expiry ON public.coupons(vendor_id, expiry_date) WHERE deleted_at IS NULL;

