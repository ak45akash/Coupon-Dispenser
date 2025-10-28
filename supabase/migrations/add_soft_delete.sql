-- Migration: Add soft delete support with trash functionality
-- This adds deleted_at and deleted_by columns to support soft deletes

-- Add soft delete columns to users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES public.users(id);

-- Add soft delete columns to vendors table
ALTER TABLE public.vendors
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES public.users(id);

-- Add soft delete columns to coupons table
ALTER TABLE public.coupons
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES public.users(id);

-- Create indexes for better query performance on deleted items
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON public.users(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_vendors_deleted_at ON public.vendors(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_coupons_deleted_at ON public.coupons(deleted_at) WHERE deleted_at IS NOT NULL;

-- Create a function to automatically delete items after 30 days
CREATE OR REPLACE FUNCTION cleanup_old_deleted_items()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete users that have been in trash for more than 30 days
  DELETE FROM public.users
  WHERE deleted_at IS NOT NULL
    AND deleted_at < NOW() - INTERVAL '30 days';

  -- Delete vendors that have been in trash for more than 30 days
  DELETE FROM public.vendors
  WHERE deleted_at IS NOT NULL
    AND deleted_at < NOW() - INTERVAL '30 days';

  -- Delete coupons that have been in trash for more than 30 days
  DELETE FROM public.coupons
  WHERE deleted_at IS NOT NULL
    AND deleted_at < NOW() - INTERVAL '30 days';
END;
$$;

-- Create a view for trashed items (for easy querying)
CREATE OR REPLACE VIEW public.trash_summary AS
SELECT 
  'user' as item_type,
  id,
  name as item_name,
  email as item_identifier,
  deleted_at,
  deleted_by,
  EXTRACT(DAY FROM (NOW() - deleted_at)) as days_in_trash,
  30 - EXTRACT(DAY FROM (NOW() - deleted_at)) as days_until_permanent_delete
FROM public.users
WHERE deleted_at IS NOT NULL

UNION ALL

SELECT 
  'vendor' as item_type,
  id,
  name as item_name,
  website as item_identifier,
  deleted_at,
  deleted_by,
  EXTRACT(DAY FROM (NOW() - deleted_at)) as days_in_trash,
  30 - EXTRACT(DAY FROM (NOW() - deleted_at)) as days_until_permanent_delete
FROM public.vendors
WHERE deleted_at IS NOT NULL

UNION ALL

SELECT 
  'coupon' as item_type,
  id,
  code as item_name,
  description as item_identifier,
  deleted_at,
  deleted_by,
  EXTRACT(DAY FROM (NOW() - deleted_at)) as days_in_trash,
  30 - EXTRACT(DAY FROM (NOW() - deleted_at)) as days_until_permanent_delete
FROM public.coupons
WHERE deleted_at IS NOT NULL

ORDER BY deleted_at DESC;

-- Grant permissions
GRANT SELECT ON public.trash_summary TO authenticated;

-- Add comments for documentation
COMMENT ON COLUMN public.users.deleted_at IS 'Timestamp when the user was soft deleted. NULL means active.';
COMMENT ON COLUMN public.users.deleted_by IS 'ID of the admin who deleted this user';
COMMENT ON COLUMN public.vendors.deleted_at IS 'Timestamp when the vendor was soft deleted. NULL means active.';
COMMENT ON COLUMN public.vendors.deleted_by IS 'ID of the admin who deleted this vendor';
COMMENT ON COLUMN public.coupons.deleted_at IS 'Timestamp when the coupon was soft deleted. NULL means active.';
COMMENT ON COLUMN public.coupons.deleted_by IS 'ID of the admin who deleted this coupon';

