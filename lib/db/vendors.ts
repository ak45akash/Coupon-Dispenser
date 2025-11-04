import { supabaseAdmin } from '@/lib/supabase/server'
import type { Vendor, VendorWithStats } from '@/types/database'
import type { CreateVendorInput, UpdateVendorInput } from '@/lib/validators/vendor'

export async function getAllVendors(limit?: number): Promise<Vendor[]> {
  let query = supabaseAdmin
    .from('vendors')
    .select('*')
    .is('deleted_at', null) // Exclude soft-deleted vendors
    .order('created_at', { ascending: false })
  
  if (limit) {
    query = query.limit(limit)
  }

  const { data, error } = await query

  if (error) throw error
  return data || []
}

export async function getVendorById(id: string): Promise<Vendor | null> {
  const { data, error } = await supabaseAdmin
    .from('vendors')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null) // Exclude soft-deleted vendors
    .single()

  if (error) return null
  return data
}

export async function getVendorsWithStats(limit?: number): Promise<VendorWithStats[]> {
  // Optimized: Get all vendors in one query
  let vendorsQuery = supabaseAdmin
    .from('vendors')
    .select('*')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
  
  if (limit) {
    vendorsQuery = vendorsQuery.limit(limit)
  }

  const { data: vendors, error: vendorsError } = await vendorsQuery

  if (vendorsError) throw vendorsError
  if (!vendors || vendors.length === 0) return []

  // Optimized: Get coupon and claim counts in parallel using raw SQL aggregation
  // This is MUCH faster than fetching all rows and counting in memory
  let couponCountsResult: { data: any; error: any } | null = null
  let claimCountsResult: { data: any; error: any } | null = null
  
  try {
    const [couponResult, claimResult] = await Promise.all([
      supabaseAdmin.rpc('get_coupon_counts_by_vendor'),
      supabaseAdmin.rpc('get_claim_counts_by_vendor'),
    ])
    couponCountsResult = couponResult
    claimCountsResult = claimResult
  } catch {
    couponCountsResult = null
    claimCountsResult = null
  }

  // Fallback: If RPC functions don't exist, use the old method
  // Updated to use is_claimed field instead of claim_history for one-time claim model
  if (!couponCountsResult || couponCountsResult.error) {
    // Fetch all coupons and count by vendor and claim status
    const { data: allCoupons, error: couponsError } = await supabaseAdmin
      .from('coupons')
      .select('vendor_id, is_claimed')
      .is('deleted_at', null)

    if (couponsError) throw couponsError

    const couponCounts = new Map<string, number>()
    const claimedCounts = new Map<string, number>()

    allCoupons?.forEach((coupon) => {
      const vendorId = coupon.vendor_id
      couponCounts.set(vendorId, (couponCounts.get(vendorId) || 0) + 1)
      if (coupon.is_claimed) {
        claimedCounts.set(vendorId, (claimedCounts.get(vendorId) || 0) + 1)
      }
    })

    return vendors.map((vendor) => {
      const total = couponCounts.get(vendor.id) || 0
      const claimed = claimedCounts.get(vendor.id) || 0
      return {
        ...vendor,
        total_coupons: total,
        claimed_coupons: claimed,
        available_coupons: total - claimed,
      }
    })
  }

  // Use RPC results for total coupons
  const couponCounts = new Map<string, number>()
  if (couponCountsResult.data) {
    couponCountsResult.data.forEach((row: any) => {
      couponCounts.set(row.vendor_id, row.count)
    })
  }

  // Count claimed coupons from is_claimed field (not from claim_history)
  const { data: claimedCoupons, error: claimedError } = await supabaseAdmin
    .from('coupons')
    .select('vendor_id')
    .is('deleted_at', null)
    .eq('is_claimed', true)

  if (claimedError) throw claimedError

  const claimedCounts = new Map<string, number>()
  claimedCoupons?.forEach((coupon) => {
    claimedCounts.set(coupon.vendor_id, (claimedCounts.get(coupon.vendor_id) || 0) + 1)
  })

  // Map vendors with stats
  return vendors.map((vendor) => {
    const total = couponCounts.get(vendor.id) || 0
    const claimed = claimedCounts.get(vendor.id) || 0
    return {
      ...vendor,
      total_coupons: total,
      claimed_coupons: claimed,
      available_coupons: total - claimed,
    }
  })
}

export async function createVendor(
  input: CreateVendorInput,
  userId: string
): Promise<Vendor> {
  const { data, error } = await supabaseAdmin
    .from('vendors')
    .insert({
      ...input,
      created_by: userId,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateVendor(
  id: string,
  input: UpdateVendorInput
): Promise<Vendor> {
  const { data, error } = await supabaseAdmin
    .from('vendors')
    .update(input)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteVendor(id: string): Promise<void> {
  const { error } = await supabaseAdmin.from('vendors').delete().eq('id', id)

  if (error) throw error
}

export async function getVendorsByPartner(userId: string): Promise<Vendor[]> {
  const { data, error } = await supabaseAdmin
    .from('partner_vendor_access')
    .select('vendor_id, vendors!inner(*)')
    .eq('user_id', userId)
    .is('vendors.deleted_at', null) // Exclude soft-deleted vendors

  if (error) throw error
  return data?.map((item: any) => item.vendors) || []
}

/**
 * Get the vendor associated with a partner admin user
 * Returns the first vendor if user has access to multiple vendors
 */
export async function getVendorByPartner(userId: string): Promise<Vendor | null> {
  const vendors = await getVendorsByPartner(userId)
  return vendors.length > 0 ? vendors[0] : null
}

/**
 * Check if a user has access to a specific vendor
 */
export async function hasVendorAccess(
  userId: string,
  vendorId: string
): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from('partner_vendor_access')
    .select('id')
    .eq('user_id', userId)
    .eq('vendor_id', vendorId)
    .single()

  if (error || !data) return false
  return true
}

