-- Migration: Add unique constraints for claim limits and update claim_month format
-- This enforces "1 coupon per coupon_id per month" and "1 coupon per vendor per user per month"

-- First, update claim_month to CHAR(6) format (YYYYMM) if it's currently DATE
-- Note: This assumes claim_month might be DATE or TEXT. We'll convert existing data.
DO $$
BEGIN
  -- Check if claim_month is DATE type
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'claim_history' 
    AND column_name = 'claim_month' 
    AND data_type = 'date'
  ) THEN
    -- Convert DATE to CHAR(6) format YYYYMM
    ALTER TABLE public.claim_history
      ALTER COLUMN claim_month TYPE TEXT;
    
    -- Update existing rows to YYYYMM format
    UPDATE public.claim_history
    SET claim_month = TO_CHAR(claim_month::date, 'YYYYMM')
    WHERE claim_month IS NOT NULL;
    
    -- Now change to CHAR(6)
    ALTER TABLE public.claim_history
      ALTER COLUMN claim_month TYPE CHAR(6);
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'claim_history' 
    AND column_name = 'claim_month' 
    AND data_type = 'text'
  ) THEN
    -- Already TEXT, just ensure format and change to CHAR(6)
    -- Update any DATE-formatted strings to YYYYMM
    UPDATE public.claim_history
    SET claim_month = TO_CHAR(claim_month::date, 'YYYYMM')
    WHERE claim_month ~ '^\d{4}-\d{2}-\d{2}';
    
    ALTER TABLE public.claim_history
      ALTER COLUMN claim_month TYPE CHAR(6);
  END IF;
END $$;

-- Ensure claim_month is CHAR(6) if column doesn't exist (shouldn't happen, but safe)
ALTER TABLE public.claim_history
  ALTER COLUMN claim_month TYPE CHAR(6);

-- Set default to current month in YYYYMM format
ALTER TABLE public.claim_history
  ALTER COLUMN claim_month SET DEFAULT TO_CHAR(NOW(), 'YYYYMM');

-- Drop existing unique constraints if they exist (to recreate them)
DO $$
BEGIN
  -- Drop constraint if exists (PostgreSQL doesn't support IF EXISTS for constraints directly)
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'unique_coupon_claim_month'
  ) THEN
    ALTER TABLE public.claim_history DROP CONSTRAINT unique_coupon_claim_month;
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'unique_vendor_user_claim_month'
  ) THEN
    ALTER TABLE public.claim_history DROP CONSTRAINT unique_vendor_user_claim_month;
  END IF;
END $$;

-- Add unique constraint: one claim per coupon (permanent)
-- This ensures only one user can claim a specific coupon EVER
-- Once claimed, the coupon is permanently unavailable to others
ALTER TABLE public.claim_history
  ADD CONSTRAINT unique_coupon_id 
  UNIQUE (coupon_id);

-- Add unique constraint: one claim per vendor per user per month
-- This ensures a user can only claim one coupon (any coupon) per vendor per month
ALTER TABLE public.claim_history
  ADD CONSTRAINT unique_vendor_user_claim_month 
  UNIQUE (vendor_id, user_id, claim_month);

-- Add index for performance (if not exists)
CREATE INDEX IF NOT EXISTS idx_claim_history_coupon_id 
  ON public.claim_history(coupon_id);

CREATE INDEX IF NOT EXISTS idx_claim_history_vendor_user_month 
  ON public.claim_history(vendor_id, user_id, claim_month);

