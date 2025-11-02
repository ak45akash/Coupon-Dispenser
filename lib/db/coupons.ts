import { supabaseAdmin } from '@/lib/supabase/server'
import type { Coupon, CouponWithVendor, MonthlyClaimRule } from '@/types/database'
import type { CreateCouponInput, BulkCreateCouponsInput } from '@/lib/validators/coupon'

export async function getAllCoupons(): Promise<Coupon[]> {
  const { data, error } = await supabaseAdmin
    .from('coupons')
    .select('*')
    .is('deleted_at', null) // Exclude soft-deleted coupons
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
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

