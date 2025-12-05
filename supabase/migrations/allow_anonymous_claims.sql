-- Migration: Allow anonymous user IDs in claimed_by field
-- This enables widget claims without requiring user authentication

-- Step 1: Drop RLS policies that reference claimed_by
DROP POLICY IF EXISTS "Users can view their claimed coupons" ON public.coupons;
DROP POLICY IF EXISTS "Users can view unclaimed coupons" ON public.coupons;

-- Step 2: Drop the foreign key constraint if it exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'coupons_claimed_by_fkey' 
    AND table_name = 'coupons'
  ) THEN
    ALTER TABLE public.coupons DROP CONSTRAINT coupons_claimed_by_fkey;
  END IF;
END $$;

-- Step 3: Change claimed_by from UUID to TEXT to support anonymous IDs
-- Format: UUID for authenticated users, "anonymous-{timestamp}-{random}" for anonymous
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'coupons' 
    AND column_name = 'claimed_by' 
    AND data_type = 'uuid'
  ) THEN
    ALTER TABLE public.coupons
      ALTER COLUMN claimed_by TYPE TEXT USING claimed_by::TEXT;
  END IF;
END $$;

-- Step 4: Recreate the index to work with TEXT
DROP INDEX IF EXISTS idx_coupons_claimed_by;
CREATE INDEX IF NOT EXISTS idx_coupons_claimed_by ON public.coupons(claimed_by);

-- Step 5: Recreate RLS policies with updated logic for TEXT claimed_by
-- Users can view unclaimed coupons
CREATE POLICY "Users can view unclaimed coupons" ON public.coupons
  FOR SELECT USING (is_claimed = false OR deleted_at IS NOT NULL);

-- Users can view their own claimed coupons (works with both UUID and anonymous IDs)
-- For authenticated users: claimed_by matches their UUID
-- For anonymous users: we allow viewing (client-side will filter based on localStorage)
CREATE POLICY "Users can view their claimed coupons" ON public.coupons
  FOR SELECT USING (
    (claimed_by IS NOT NULL AND (
      -- For authenticated users: check if claimed_by matches auth.uid() as text
      (claimed_by = COALESCE(auth.uid()::TEXT, ''))
      -- For anonymous users: allow viewing (client-side handles filtering)
      OR (claimed_by LIKE 'anonymous-%')
    ))
    OR deleted_at IS NOT NULL
  );

-- Note: claim_history still requires real user IDs due to foreign key constraint
-- Anonymous claims will skip claim_history insertion (handled in application code)

