-- Universal Seed Data for Trash Testing
-- This script soft-deletes some existing items regardless of their names

-- Get the super admin ID for deleted_by
DO $$
DECLARE
  admin_id UUID;
BEGIN
  -- Get the first super admin
  SELECT id INTO admin_id FROM public.users WHERE role = 'super_admin' LIMIT 1;
  
  -- If no super admin, get any user
  IF admin_id IS NULL THEN
    SELECT id INTO admin_id FROM public.users LIMIT 1;
  END IF;
  
  -- Soft delete the first 3 vendors (if they exist and aren't already deleted)
  UPDATE public.vendors
  SET 
    deleted_at = NOW() - INTERVAL '2 days',
    deleted_by = admin_id
  WHERE id IN (
    SELECT id FROM public.vendors 
    WHERE deleted_at IS NULL 
    LIMIT 1
  );
  
  UPDATE public.vendors
  SET 
    deleted_at = NOW() - INTERVAL '12 days',
    deleted_by = admin_id
  WHERE id IN (
    SELECT id FROM public.vendors 
    WHERE deleted_at IS NULL 
    LIMIT 1 OFFSET 1
  );
  
  UPDATE public.vendors
  SET 
    deleted_at = NOW() - INTERVAL '26 days',
    deleted_by = admin_id
  WHERE id IN (
    SELECT id FROM public.vendors 
    WHERE deleted_at IS NULL 
    LIMIT 1 OFFSET 2
  );
  
  -- Soft delete the first 3 coupons (if they exist and aren't already deleted)
  UPDATE public.coupons
  SET 
    deleted_at = NOW() - INTERVAL '5 days',
    deleted_by = admin_id
  WHERE id IN (
    SELECT id FROM public.coupons 
    WHERE deleted_at IS NULL 
    LIMIT 1
  );
  
  UPDATE public.coupons
  SET 
    deleted_at = NOW() - INTERVAL '15 days',
    deleted_by = admin_id
  WHERE id IN (
    SELECT id FROM public.coupons 
    WHERE deleted_at IS NULL 
    LIMIT 1 OFFSET 1
  );
  
  UPDATE public.coupons
  SET 
    deleted_at = NOW() - INTERVAL '28 days',
    deleted_by = admin_id
  WHERE id IN (
    SELECT id FROM public.coupons 
    WHERE deleted_at IS NULL 
    LIMIT 1 OFFSET 2
  );
  
  RAISE NOTICE '✅ Trash seeding complete!';
END $$;

-- Verify the trash_summary view
SELECT 
  item_type,
  item_name,
  item_identifier,
  ROUND(days_in_trash::numeric, 1) as days_in_trash,
  ROUND(days_until_permanent_delete::numeric, 1) as days_remaining
FROM public.trash_summary
ORDER BY deleted_at DESC;

