-- Delete all test coupons from the coupons table
-- This will soft delete them (mark as deleted, move to trash)

UPDATE public.coupons
SET 
  deleted_at = NOW(),
  deleted_by = (
    SELECT id FROM public.users WHERE role = 'super_admin' LIMIT 1
  )
WHERE deleted_at IS NULL;

-- Optional: If you want to permanently delete (hard delete) instead:
-- DELETE FROM public.coupons;

-- Note: The coupons are soft-deleted, so they will still exist in the database
-- but won't appear in normal queries. You can restore them from the trash if needed,
-- or permanently delete them from the admin dashboard.

