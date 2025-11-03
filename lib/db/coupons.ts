import { supabaseAdmin } from '@/lib/supabase/server'
import type { Coupon, CouponWithVendor, MonthlyClaimRule } from '@/types/database'
import type { CreateCouponInput, BulkCreateCouponsInput } from '@/lib/validators/coupon'

export async function getAllCoupons(limit?: number): Promise<Coupon[]> {
  let query = supabaseAdmin
    .from('coupons')
    .select('*')
    .is('deleted_at', null) // Exclude soft-deleted coupons
    .order('created_at', { ascending: false })
  
  if (limit) {
    query = query.limit(limit)
  }

  const { data, error } = await query

  if (error) throw error
  return data || []
}

export interface CouponWithClaimCount extends Coupon {
  claim_count: number
}

export async function getAllCouponsWithClaimCount(limit?: number): Promise<CouponWithClaimCount[]> {
  const coupons = await getAllCoupons(limit)
  if (coupons.length === 0) return []
  
  // OPTIMIZED: Try using SQL aggregation function first
  let claimCountsResult: { data: any; error: any } | null = null
  try {
    claimCountsResult = await supabaseAdmin.rpc('get_claim_counts_by_coupon')
  } catch {
    claimCountsResult = null
  }

  // Fallback: If RPC function doesn't exist, use the old method
  if (!claimCountsResult || claimCountsResult.error) {
    const { data: claimHistory, error } = await supabaseAdmin
      .from('claim_history')
      .select('coupon_id')
    
    if (error) throw error
    
    const claimCounts = new Map<string, number>()
    claimHistory?.forEach((claim) => {
      claimCounts.set(claim.coupon_id, (claimCounts.get(claim.coupon_id) || 0) + 1)
    })
    
    return coupons.map((coupon) => ({
      ...coupon,
      claim_count: claimCounts.get(coupon.id) || 0,
    }))
  }

  // Use RPC results
  const claimCounts = new Map<string, number>()
  if (claimCountsResult.data) {
    claimCountsResult.data.forEach((row: any) => {
      claimCounts.set(row.coupon_id, row.count)
    })
  }
  
  return coupons.map((coupon) => ({
    ...coupon,
    claim_count: claimCounts.get(coupon.id) || 0,
  }))
}

export async function getCouponsByVendor(vendorId: string): Promise<Coupon[]> {
  const { data, error } = await supabaseAdmin
    .from('coupons')
    .select('*')
    .eq('vendor_id', vendorId)
    .is('deleted_at', null) // Exclude soft-deleted coupons
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function getAvailableCouponsByVendor(
  vendorId: string
): Promise<Coupon[]> {
  // All coupons are available (shared model)
  // Monthly limits are enforced through claim_history
  const { data, error } = await supabaseAdmin
    .from('coupons')
    .select('*')
    .eq('vendor_id', vendorId)
    .is('deleted_at', null) // Exclude soft-deleted coupons
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function getCouponById(id: string): Promise<Coupon | null> {
  const { data, error } = await supabaseAdmin
    .from('coupons')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null) // Exclude soft-deleted coupons
    .single()

  if (error) return null
  return data
}

export async function createCoupon(
  input: CreateCouponInput,
  userId: string
): Promise<Coupon> {
  const { data, error } = await supabaseAdmin
    .from('coupons')
    .insert({
      ...input,
      created_by: userId,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function bulkCreateCoupons(
  input: BulkCreateCouponsInput,
  userId: string
): Promise<Coupon[]> {
  const couponsToInsert = input.coupons.map((coupon) => ({
    ...coupon,
    vendor_id: input.vendor_id,
    created_by: userId,
  }))

  const { data, error } = await supabaseAdmin
    .from('coupons')
    .insert(couponsToInsert)
    .select()

  if (error) throw error
  return data || []
}

export async function deleteCoupon(id: string): Promise<void> {
  const { error } = await supabaseAdmin.from('coupons').delete().eq('id', id)

  if (error) throw error
}

export async function checkMonthlyClaimLimit(
  userId: string,
  vendorId: string
): Promise<boolean> {
  // Get monthly claim rule
  const { data: config } = await supabaseAdmin
    .from('system_config')
    .select('value')
    .eq('key', 'monthly_claim_rule')
    .single()

  if (!config) return true

  const rule = config.value as MonthlyClaimRule
  if (!rule.enabled) return true

  // Check claims this month
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { data, error } = await supabaseAdmin
    .from('claim_history')
    .select('id')
    .eq('user_id', userId)
    .eq('vendor_id', vendorId)
    .gte('claimed_at', startOfMonth.toISOString())

  if (error) throw error

  const claimCount = data?.length || 0
  return claimCount < rule.max_claims_per_vendor
}

export async function claimCoupon(
  userId: string,
  vendorId: string
): Promise<Coupon> {
  // Check monthly limit
  const canClaim = await checkMonthlyClaimLimit(userId, vendorId)
  if (!canClaim) {
    throw new Error('Monthly claim limit reached for this vendor')
  }

  // Get any coupon for this vendor (all coupons are shared/available)
  const { data: coupon, error: couponError } = await supabaseAdmin
    .from('coupons')
    .select('*')
    .eq('vendor_id', vendorId)
    .is('deleted_at', null) // Exclude soft-deleted coupons
    .limit(1)
    .single()

  if (couponError || !coupon) {
    throw new Error('No coupons available for this vendor')
  }

  // Record claim history (this is the only place we track claims now)
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { error: historyError } = await supabaseAdmin
    .from('claim_history')
    .insert({
      user_id: userId,
      vendor_id: vendorId,
      coupon_id: coupon.id,
      claim_month: startOfMonth.toISOString().split('T')[0],
    })

  if (historyError) throw historyError

  // Return the coupon (unchanged - it's shared)
  return coupon
}

export async function getCouponsWithVendor(): Promise<CouponWithVendor[]> {
  const { data, error } = await supabaseAdmin
    .from('coupons')
    .select(`
      *,
      vendor:vendors(*)
    `)
    .is('deleted_at', null) // Exclude soft-deleted coupons
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as any || []
}

/**
 * Get detailed claim history for a specific coupon
 */
export async function getCouponClaimHistory(couponId: string) {
  const { data, error } = await supabaseAdmin
    .from('claim_history')
    .select(`
      *,
      user:users(id, email, name, role, created_at),
      vendor:vendors(id, name)
    `)
    .eq('coupon_id', couponId)
    .order('claimed_at', { ascending: false })

  if (error) throw error
  return data || []
}

/**
 * Calculate next available claim date for a user for a specific vendor
 * Returns null if user can claim now, or a date string for when they can claim next
 */
export async function getNextAvailableClaimDate(
  userId: string,
  vendorId: string
): Promise<string | null> {
  // Get monthly claim rule
  const { data: config } = await supabaseAdmin
    .from('system_config')
    .select('value')
    .eq('key', 'monthly_claim_rule')
    .single()

  if (!config) return null

  const rule = config.value as MonthlyClaimRule
  if (!rule.enabled) return null

  // Check claims this month
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { data, error } = await supabaseAdmin
    .from('claim_history')
    .select('claimed_at, claim_month')
    .eq('user_id', userId)
    .eq('vendor_id', vendorId)
    .gte('claimed_at', startOfMonth.toISOString())
    .order('claimed_at', { ascending: false })

  if (error) throw error

  const claimCount = data?.length || 0
  if (claimCount < rule.max_claims_per_vendor) {
    return null // Can claim now
  }

  // User has reached limit - return first day of next month
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  nextMonth.setHours(0, 0, 0, 0)
  return nextMonth.toISOString()
}

/**
 * Get claim statistics for a coupon
 */
export async function getCouponClaimStats(couponId: string) {
  const { count: totalClaims, error: countError } = await supabaseAdmin
    .from('claim_history')
    .select('*', { count: 'exact', head: true })
    .eq('coupon_id', couponId)

  if (countError) throw countError

  // Get claims this month
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { count: thisMonthClaims, error: monthError } = await supabaseAdmin
    .from('claim_history')
    .select('*', { count: 'exact', head: true })
    .eq('coupon_id', couponId)
    .gte('claimed_at', startOfMonth.toISOString())

  if (monthError) throw monthError

  // Get unique users who claimed
  const { data: uniqueUsers, error: usersError } = await supabaseAdmin
    .from('claim_history')
    .select('user_id')
    .eq('coupon_id', couponId)

  if (usersError) throw usersError

  const uniqueUserCount = new Set(uniqueUsers?.map((c: any) => c.user_id) || []).size

  return {
    total_claims: totalClaims || 0,
    this_month_claims: thisMonthClaims || 0,
    unique_users: uniqueUserCount,
  }
}

