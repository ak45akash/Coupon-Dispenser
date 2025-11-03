-- Delete all test data except users
-- This will soft delete vendors, coupons, and claim history

-- Soft delete all vendors (this will cascade to delete their coupons via the function)
UPDATE public.vendors
SET 
  deleted_at = NOW(),
  deleted_by = (
    SELECT id FROM public.users WHERE role = 'super_admin' LIMIT 1
  )
WHERE deleted_at IS NULL;

-- Soft delete all coupons (in case any remain)
UPDATE public.coupons
SET 
  deleted_at = NOW(),
  deleted_by = (
    SELECT id FROM public.users WHERE role = 'super_admin' LIMIT 1
  )
WHERE deleted_at IS NULL;

-- Delete all claim history records
DELETE FROM public.claim_history;

-- Clean up partner vendor access assignments
DELETE FROM public.partner_vendor_access;

-- Optional: If you want to permanently delete instead (HARD DELETE - CAUTION!):
-- Uncomment the following lines:
-- DELETE FROM public.claim_history;
-- DELETE FROM public.partner_vendor_access;
-- DELETE FROM public.coupons;
-- DELETE FROM public.vendors;

-- Users table is NOT touched - all user accounts remain intact

