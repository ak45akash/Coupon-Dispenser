-- Seed data for trash/soft delete testing
-- This script creates some deleted items to test the trash functionality

-- Soft delete some vendors (set deleted_at to various times for testing time-based features)
UPDATE public.vendors
SET 
  deleted_at = NOW() - INTERVAL '2 days',
  deleted_by = (SELECT id FROM public.users WHERE role = 'super_admin' LIMIT 1)
WHERE name = 'Acme Store'
  AND deleted_at IS NULL;

UPDATE public.vendors
SET 
  deleted_at = NOW() - INTERVAL '10 days',
  deleted_by = (SELECT id FROM public.users WHERE role = 'super_admin' LIMIT 1)
WHERE name = 'Tech Haven'
  AND deleted_at IS NULL;

UPDATE public.vendors
SET 
  deleted_at = NOW() - INTERVAL '25 days',
  deleted_by = (SELECT id FROM public.users WHERE role = 'super_admin' LIMIT 1)
WHERE name = 'Fashion Forward'
  AND deleted_at IS NULL;

-- Soft delete some coupons
UPDATE public.coupons
SET 
  deleted_at = NOW() - INTERVAL '5 days',
  deleted_by = (SELECT id FROM public.users WHERE role = 'super_admin' LIMIT 1)
WHERE code = 'SAVE10'
  AND deleted_at IS NULL;

UPDATE public.coupons
SET 
  deleted_at = NOW() - INTERVAL '15 days',
  deleted_by = (SELECT id FROM public.users WHERE role = 'super_admin' LIMIT 1)
WHERE code = 'WELCOME20'
  AND deleted_at IS NULL;

UPDATE public.coupons
SET 
  deleted_at = NOW() - INTERVAL '28 days',
  deleted_by = (SELECT id FROM public.users WHERE role = 'super_admin' LIMIT 1)
WHERE code = 'FLASH50'
  AND deleted_at IS NULL;

-- Verify the trash_summary view
SELECT 
  item_type,
  item_name,
  item_identifier,
  days_in_trash,
  days_until_permanent_delete
FROM public.trash_summary
ORDER BY deleted_at DESC;

