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
  const { data, error } = await supabaseAdmin
    .from('vendors')
    .select(`
      *,
      coupons:coupons(count)
    `)
    .is('deleted_at', null) // Exclude soft-deleted vendors
    .order('created_at', { ascending: false })

  if (error) throw error

  // Calculate stats for each vendor
  const vendorsWithStats = await Promise.all(
    (data || []).map(async (vendor) => {
      // Get total coupons (all are available in shared model)
      const { count: totalCouponsCount } = await supabaseAdmin
        .from('coupons')
        .select('id', { count: 'exact', head: true })
        .eq('vendor_id', vendor.id)
        .is('deleted_at', null) // Exclude soft-deleted coupons

      // Get total claims from claim_history
      const { count: claimedCouponsCount } = await supabaseAdmin
        .from('claim_history')
        .select('id', { count: 'exact', head: true })
        .eq('vendor_id', vendor.id)

      const total_coupons = totalCouponsCount || 0
      const claimed_coupons = claimedCouponsCount || 0 // Total claims for this vendor
      const available_coupons = total_coupons // All coupons are available (shared)

      return {
        ...vendor,
        total_coupons,
        claimed_coupons,
        available_coupons,
      }
    })
  )

  return vendorsWithStats
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

