import { supabaseAdmin } from '@/lib/supabase/server'
import type { Vendor, VendorWithStats } from '@/types/database'
import type { CreateVendorInput, UpdateVendorInput } from '@/lib/validators/vendor'

export async function getAllVendors(): Promise<Vendor[]> {
  const { data, error } = await supabaseAdmin
    .from('vendors')
    .select('*')
    .is('deleted_at', null) // Exclude soft-deleted vendors
    .order('created_at', { ascending: false })

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

export async function getVendorsWithStats(): Promise<VendorWithStats[]> {
  // Optimized: Get all vendors in one query
  const { data: vendors, error: vendorsError } = await supabaseAdmin
    .from('vendors')
    .select('*')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (vendorsError) throw vendorsError
  if (!vendors || vendors.length === 0) return []

  // Optimized: Get all coupon counts in one query using aggregation
  const { data: couponStats, error: couponsError } = await supabaseAdmin
    .from('coupons')
    .select('vendor_id')
    .is('deleted_at', null)

  if (couponsError) throw couponsError

  // Optimized: Get all claim counts in one query
  const { data: claimStats, error: claimsError } = await supabaseAdmin
    .from('claim_history')
    .select('vendor_id')

  if (claimsError) throw claimsError

  // Calculate counts in memory (O(n) instead of O(n²))
  const couponCounts = new Map<string, number>()
  couponStats?.forEach((coupon) => {
    couponCounts.set(coupon.vendor_id, (couponCounts.get(coupon.vendor_id) || 0) + 1)
  })

  const claimCounts = new Map<string, number>()
  claimStats?.forEach((claim) => {
    claimCounts.set(claim.vendor_id, (claimCounts.get(claim.vendor_id) || 0) + 1)
  })

  // Map vendors with stats
  return vendors.map((vendor) => ({
    ...vendor,
    total_coupons: couponCounts.get(vendor.id) || 0,
    claimed_coupons: claimCounts.get(vendor.id) || 0,
    available_coupons: couponCounts.get(vendor.id) || 0, // All coupons available (shared)
  }))
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

