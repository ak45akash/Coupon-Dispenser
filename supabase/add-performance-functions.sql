-- Performance optimization functions for efficient aggregation
-- These use PostgreSQL native aggregation which is much faster than fetching all rows

-- Function to get coupon counts per vendor
CREATE OR REPLACE FUNCTION get_coupon_counts_by_vendor()
RETURNS TABLE(vendor_id UUID, count BIGINT)
LANGUAGE sql
STABLE
AS $$
  SELECT vendor_id, COUNT(*)::BIGINT as count
  FROM public.coupons
  WHERE deleted_at IS NULL
  GROUP BY vendor_id;
$$;

-- Function to get claim counts per vendor  
CREATE OR REPLACE FUNCTION get_claim_counts_by_vendor()
RETURNS TABLE(vendor_id UUID, count BIGINT)
LANGUAGE sql
STABLE
AS $$
  SELECT vendor_id, COUNT(*)::BIGINT as count
  FROM public.claim_history
  GROUP BY vendor_id;
$$;

-- Function to get claim counts per coupon (for coupon stats)
CREATE OR REPLACE FUNCTION get_claim_counts_by_coupon()
RETURNS TABLE(coupon_id UUID, count BIGINT)
LANGUAGE sql
STABLE
AS $$
  SELECT coupon_id, COUNT(*)::BIGINT as count
  FROM public.claim_history
  GROUP BY coupon_id;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_coupon_counts_by_vendor() TO authenticated;
GRANT EXECUTE ON FUNCTION get_claim_counts_by_vendor() TO authenticated;
GRANT EXECUTE ON FUNCTION get_claim_counts_by_coupon() TO authenticated;

