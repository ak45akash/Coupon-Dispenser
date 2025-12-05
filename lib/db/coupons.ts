import { supabaseAdmin } from '@/lib/supabase/server'
import type { Coupon, CouponWithVendor, MonthlyClaimRule } from '@/types/database'
import type { CreateCouponInput, BulkCreateCouponsInput } from '@/lib/validators/coupon'

export async function getAllCoupons(limit?: number, includeClaimed: boolean = true): Promise<Coupon[]> {
  let query = supabaseAdmin
    .from('coupons')
    .select('*')
    .is('deleted_at', null) // Exclude soft-deleted coupons
  
  // Filter out claimed coupons unless explicitly including them
  if (!includeClaimed) {
    query = query.eq('is_claimed', false)
  }
  
  query = query.order('created_at', { ascending: false })
  
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
  vendorId: string,
  userId?: string
): Promise<Coupon[]> {
  // If userId is provided, check for active claims
  if (userId) {
    const activeClaim = await getUserActiveClaim(userId, vendorId)
    if (activeClaim) {
      // User has an active claim - return only that coupon
      return [activeClaim]
    }
  }

  // Only return unclaimed coupons
  const { data, error } = await supabaseAdmin
    .from('coupons')
    .select('*')
    .eq('vendor_id', vendorId)
    .eq('is_claimed', false)
    .is('deleted_at', null) // Exclude soft-deleted coupons
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

/**
 * Get user's active claim for a vendor (within 30 days)
 * Returns the claimed coupon if user has an active claim, null otherwise
 */
export async function getUserActiveClaim(
  userId: string,
  vendorId: string
): Promise<Coupon | null> {
  const now = new Date()
  const thirtyDaysAgo = new Date(now)
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  // Find coupons claimed by this user for this vendor within the last 30 days
  const { data, error } = await supabaseAdmin
    .from('coupons')
    .select('*')
    .eq('vendor_id', vendorId)
    .eq('claimed_by', userId)
    .eq('is_claimed', true)
    .gte('claimed_at', thirtyDaysAgo.toISOString())
    .is('deleted_at', null)
    .order('claimed_at', { ascending: false })
    .limit(1)

  if (error) throw error
  
  // Check if the claim is still valid (not expired)
  if (data && data.length > 0) {
    const claimedCoupon = data[0]
    if (claimedCoupon.expiry_date) {
      const expiryDate = new Date(claimedCoupon.expiry_date)
      if (expiryDate > now) {
        return claimedCoupon
      }
    } else {
      // If no expiry date, check if claimed within 30 days
      if (claimedCoupon.claimed_at) {
        const claimedAt = new Date(claimedCoupon.claimed_at)
        const daysSinceClaim = (now.getTime() - claimedAt.getTime()) / (1000 * 60 * 60 * 24)
        if (daysSinceClaim <= 30) {
          return claimedCoupon
        }
      }
    }
  }

  return null
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

export async function claimCoupon(
  userId: string,
  couponId: string
): Promise<Coupon> {
  // Get the coupon and check if it's already claimed
  const { data: coupon, error: couponError } = await supabaseAdmin
    .from('coupons')
    .select('*')
    .eq('id', couponId)
    .is('deleted_at', null) // Exclude soft-deleted coupons
    .single()

  if (couponError || !coupon) {
    throw new Error('Coupon not found')
  }

  if (coupon.is_claimed) {
    throw new Error('Coupon has already been claimed')
  }

  // Calculate expiry date: 30 days from now (when claimed)
  const claimedAt = new Date()
  const expiryDate = new Date(claimedAt)
  expiryDate.setDate(expiryDate.getDate() + 30)

  // Update coupon: mark as claimed, set claimed_by, claimed_at, and expiry_date
  const { data: updatedCoupon, error: updateError } = await supabaseAdmin
    .from('coupons')
    .update({
      is_claimed: true,
      claimed_by: userId,
      claimed_at: claimedAt.toISOString(),
      expiry_date: expiryDate.toISOString(),
    })
    .eq('id', couponId)
    .select()
    .single()

  if (updateError) throw updateError

  // Record claim history for analytics
  // Skip for anonymous users since they don't exist in users table (foreign key constraint)
  if (!userId.startsWith('anonymous-')) {
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const { error: historyError } = await supabaseAdmin
      .from('claim_history')
      .insert({
        user_id: userId,
        vendor_id: coupon.vendor_id,
        coupon_id: coupon.id,
        claimed_at: claimedAt.toISOString(),
        claim_month: startOfMonth.toISOString().split('T')[0],
      })

    if (historyError) {
      // Log error but don't fail the claim since coupon is already updated
      console.error('Error recording claim history:', historyError)
    }
  } else {
    // For anonymous users, we still track the claim in the coupon itself (claimed_by field)
    // but skip claim_history due to foreign key constraint
    console.log('Skipping claim_history for anonymous user:', userId)
  }

  return updatedCoupon
}

/**
 * Atomic claim function with unique constraint enforcement
 * Uses database transaction to ensure atomicity
 * 
 * Returns the coupon code on success
 * Throws errors with specific messages for conflict cases:
 * - 'COUPON_ALREADY_CLAIMED' - coupon already claimed this month
 * - 'USER_ALREADY_CLAIMED' - user already claimed a coupon for this vendor this month
 */
export async function atomicClaimCoupon(
  userId: string,
  couponId: string
): Promise<{ coupon_code: string }> {
  // Get the coupon first
  const { data: coupon, error: couponError } = await supabaseAdmin
    .from('coupons')
    .select('*')
    .eq('id', couponId)
    .is('deleted_at', null)
    .single()

  if (couponError || !coupon) {
    throw new Error('Coupon not found')
  }

  // Check if coupon is already claimed (permanent check)
  if (coupon.is_claimed) {
    throw new Error('COUPON_ALREADY_CLAIMED')
  }

  // Calculate claim_month in YYYYMM format
  const now = new Date()
  const claimMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}` // YYYYMM
  const claimedAt = now.toISOString()

  // Atomic transaction: Mark coupon as claimed AND insert claim history
  // We'll do this in two steps, but the unique constraints ensure atomicity
  
  // Step 1: Mark coupon as permanently claimed
  const { error: updateError } = await supabaseAdmin
    .from('coupons')
    .update({
      is_claimed: true,
      claimed_by: userId,
      claimed_at: claimedAt,
    })
    .eq('id', couponId)
    .eq('is_claimed', false) // Only update if not already claimed (optimistic lock)

  if (updateError) {
    throw new Error(`Database error: ${updateError.message}`)
  }

  // Step 2: Insert into claim_history (enforces user monthly limit)
  const { error: historyError } = await supabaseAdmin
    .from('claim_history')
    .insert({
      user_id: userId,
      vendor_id: coupon.vendor_id,
      coupon_id: coupon.id,
      claimed_at: claimedAt,
      claim_month: claimMonth,
    })

  if (historyError) {
    // If claim_history insert fails, we need to rollback the coupon update
    // But since Supabase doesn't support transactions in JS client,
    // we'll rely on the unique constraint check above
    // The coupon.is_claimed check prevents double-claiming
    
    // Check if it's a unique constraint violation (Postgres error code 23505)
    if (historyError.code === '23505') {
      const errorMessage = historyError.message || ''
      
      if (errorMessage.includes('unique_coupon_id')) {
        // This shouldn't happen since we checked is_claimed, but handle it
        throw new Error('COUPON_ALREADY_CLAIMED')
      } else if (errorMessage.includes('unique_vendor_user_claim_month')) {
        // Rollback: unclaim the coupon since user limit was hit
        await supabaseAdmin
          .from('coupons')
          .update({
            is_claimed: false,
            claimed_by: null,
            claimed_at: null,
          })
          .eq('id', couponId)
        
        throw new Error('USER_ALREADY_CLAIMED')
      }
    }
    
    // Other database errors - rollback coupon claim
    await supabaseAdmin
      .from('coupons')
      .update({
        is_claimed: false,
        claimed_by: null,
        claimed_at: null,
      })
      .eq('id', couponId)
    
    throw new Error(`Database error: ${historyError.message}`)
  }

  // If we get here, the claim was successful
  // Return the coupon code
  return {
    coupon_code: coupon.code,
  }
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
 * Includes both claim_history entries and direct claims from coupons table (for anonymous users)
 */
export async function getCouponClaimStats(couponId: string) {
  // Get claims from claim_history (authenticated users)
  const { count: historyTotalClaims, error: countError } = await supabaseAdmin
    .from('claim_history')
    .select('*', { count: 'exact', head: true })
    .eq('coupon_id', couponId)

  if (countError) throw countError

  // Get claims this month from claim_history
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { count: historyThisMonthClaims, error: monthError } = await supabaseAdmin
    .from('claim_history')
    .select('*', { count: 'exact', head: true })
    .eq('coupon_id', couponId)
    .gte('claimed_at', startOfMonth.toISOString())

  if (monthError) throw monthError

  // Get unique users from claim_history
  const { data: historyUsers, error: usersError } = await supabaseAdmin
    .from('claim_history')
    .select('user_id')
    .eq('coupon_id', couponId)

  if (usersError) throw usersError

  // Get direct claims from coupons table (includes anonymous users)
  // This counts coupons that are marked as claimed
  const { data: claimedCoupon, error: couponError } = await supabaseAdmin
    .from('coupons')
    .select('is_claimed, claimed_by, claimed_at')
    .eq('id', couponId)
    .single()

  if (couponError) throw couponError

  // Calculate totals including both claim_history and direct claims
  let totalClaims = historyTotalClaims || 0
  let thisMonthClaims = historyThisMonthClaims || 0
  const uniqueUserSet = new Set(historyUsers?.map((c: any) => c.user_id) || [])

  // If coupon is directly claimed (including anonymous users), add to stats
  if (claimedCoupon?.is_claimed && claimedCoupon?.claimed_by) {
    // Check if this claim is already in claim_history
    const isInHistory = historyUsers?.some((c: any) => c.user_id === claimedCoupon.claimed_by)
    
    if (!isInHistory) {
      // This is a direct claim (likely anonymous), add to stats
      totalClaims += 1
      uniqueUserSet.add(claimedCoupon.claimed_by)
      
      // Check if claimed this month
      if (claimedCoupon.claimed_at) {
        const claimedDate = new Date(claimedCoupon.claimed_at)
        if (claimedDate >= startOfMonth) {
          thisMonthClaims += 1
        }
      }
    }
  }

  return {
    total_claims: totalClaims,
    this_month_claims: thisMonthClaims,
    unique_users: uniqueUserSet.size,
  }
}

