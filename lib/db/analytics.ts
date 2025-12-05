import { supabaseAdmin } from '@/lib/supabase/server'
import type {
  AnalyticsOverview,
  VendorAnalytics,
  ClaimTrend,
  TopVendor,
} from '@/types/api'
import { startOfMonth, format } from 'date-fns'

export async function getAnalyticsOverview(): Promise<AnalyticsOverview> {
  try {
    // Get counts in parallel
    const [vendorsResult, couponsResult, usersResult, claimsResult, totalClaimsResult] =
      await Promise.all([
        supabaseAdmin.from('vendors').select('id', { count: 'exact' }),
        supabaseAdmin.from('coupons').select('id', { count: 'exact' }),
        supabaseAdmin.from('users').select('id', { count: 'exact' }),
        supabaseAdmin
          .from('claim_history')
          .select('id', { count: 'exact' })
          .gte('claimed_at', startOfMonth(new Date()).toISOString()),
        supabaseAdmin.from('claim_history').select('id', { count: 'exact' }),
      ])

    // Check for errors
    if (vendorsResult.error) {
      console.error('Error fetching vendors count:', vendorsResult.error)
    }
    if (couponsResult.error) {
      console.error('Error fetching coupons count:', couponsResult.error)
    }
    if (usersResult.error) {
      console.error('Error fetching users count:', usersResult.error)
    }
    if (claimsResult.error) {
      console.error('Error fetching claims count:', claimsResult.error)
    }
    if (totalClaimsResult.error) {
      console.error('Error fetching total claims count:', totalClaimsResult.error)
    }

    const total_vendors = vendorsResult.count || 0
    const total_coupons = couponsResult.count || 0
    const claimed_coupons = totalClaimsResult.count || 0 // Total claims ever made
    const available_coupons = total_coupons // All coupons are available (shared)
    const total_users = usersResult.count || 0
    const claims_this_month = claimsResult.count || 0

    return {
      total_vendors,
      total_coupons,
      claimed_coupons,
      available_coupons,
      total_users,
      claims_this_month,
    }
  } catch (error) {
    console.error('Error in getAnalyticsOverview:', error)
    // Return default values on error
    return {
      total_vendors: 0,
      total_coupons: 0,
      claimed_coupons: 0,
      available_coupons: 0,
      total_users: 0,
      claims_this_month: 0,
    }
  }
}

export async function getVendorAnalytics(
  vendorId?: string
): Promise<VendorAnalytics[]> {
  let query = supabaseAdmin.from('vendors').select('id, name')

  if (vendorId) {
    query = query.eq('id', vendorId)
  }

  const { data: vendors, error } = await query

  if (error) throw error
  if (!vendors || vendors.length === 0) return []

  // Optimized: Get all data in parallel bulk queries
  const twelveMonthsAgo = new Date()
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)

  // Batch query for all coupons
  let couponQuery = supabaseAdmin
    .from('coupons')
    .select('vendor_id')
    .is('deleted_at', null)

  if (vendorId) {
    couponQuery = couponQuery.eq('vendor_id', vendorId)
  }

  // Batch query for all claims
  let claimQuery = supabaseAdmin
    .from('claim_history')
    .select('vendor_id, claim_month, claimed_at')

  if (vendorId) {
    claimQuery = claimQuery.eq('vendor_id', vendorId)
  }

  // Run queries in parallel
  const [couponsResult, claimsResult] = await Promise.all([
    couponQuery,
    claimQuery,
  ])

  if (couponsResult.error) throw couponsResult.error
  if (claimsResult.error) throw claimsResult.error

  // Calculate stats in memory (O(n) instead of O(n²))
  const couponCounts = new Map<string, number>()
  couponsResult.data?.forEach((coupon) => {
    couponCounts.set(coupon.vendor_id, (couponCounts.get(coupon.vendor_id) || 0) + 1)
  })

  const claimCounts = new Map<string, number>()
  claimsResult.data?.forEach((claim) => {
    claimCounts.set(claim.vendor_id, (claimCounts.get(claim.vendor_id) || 0) + 1)
  })

  // Group claims by vendor and month
  const claimsByMonthMap = new Map<string, Map<string, number>>()
  claimsResult.data?.forEach((claim) => {
    if (new Date(claim.claimed_at) >= twelveMonthsAgo) {
      if (!claimsByMonthMap.has(claim.vendor_id)) {
        claimsByMonthMap.set(claim.vendor_id, new Map())
      }
      const monthMap = claimsByMonthMap.get(claim.vendor_id)!
      monthMap.set(claim.claim_month, (monthMap.get(claim.claim_month) || 0) + 1)
    }
  })

  // Map vendors with stats
  return vendors.map((vendor) => {
    const total_coupons = couponCounts.get(vendor.id) || 0
    const claimed_coupons = claimCounts.get(vendor.id) || 0
    const available_coupons = total_coupons
    const claim_rate = total_coupons > 0 ? (claimed_coupons / total_coupons) * 100 : 0

    const monthMap = claimsByMonthMap.get(vendor.id) || new Map()
    const claims_by_month = Array.from(monthMap.entries()).map(([month, count]) => ({
      month,
      count,
    }))

    return {
      vendor_id: vendor.id,
      vendor_name: vendor.name,
      total_coupons,
      claimed_coupons,
      available_coupons,
      claim_rate,
      claims_by_month,
    }
  })
}

export async function getClaimTrends(days: number = 30, vendorId?: string): Promise<ClaimTrend[]> {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  let query = supabaseAdmin
    .from('claim_history')
    .select('claimed_at')
    .gte('claimed_at', startDate.toISOString())
    .order('claimed_at', { ascending: true })

  if (vendorId) {
    query = query.eq('vendor_id', vendorId)
  }

  const { data, error } = await query

  if (error) throw error

  // Group by date
  const claimsByDate = (data || []).reduce(
    (acc, claim) => {
      const date = format(new Date(claim.claimed_at), 'yyyy-MM-dd')
      acc[date] = (acc[date] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  return Object.entries(claimsByDate).map(([date, count]) => ({
    date,
    count,
  }))
}

export async function getTopVendors(limit: number = 10): Promise<TopVendor[]> {
  const { data, error } = await supabaseAdmin
    .from('claim_history')
    .select('vendor_id, vendors(name)')

  if (error) throw error

  // Count claims per vendor
  const claimCounts = (data || []).reduce(
    (acc, claim: any) => {
      const vendorId = claim.vendor_id
      const vendorName = claim.vendors?.name || 'Unknown'
      if (!acc[vendorId]) {
        acc[vendorId] = { vendor_id: vendorId, vendor_name: vendorName, total_claims: 0 }
      }
      acc[vendorId].total_claims++
      return acc
    },
    {} as Record<string, TopVendor>
  )

  return Object.values(claimCounts)
    .sort((a, b) => b.total_claims - a.total_claims)
    .slice(0, limit)
}

export async function getClaimHistoryWithDetails(
  filters?: {
    vendorId?: string
    startDate?: string
    endDate?: string
  }
) {
  let query = supabaseAdmin
    .from('claim_history')
    .select(`
      *,
      user:users(id, email, name),
      vendor:vendors(id, name),
      coupon:coupons(id, code, discount_value)
    `)
    .order('claimed_at', { ascending: false })

  if (filters?.vendorId) {
    query = query.eq('vendor_id', filters.vendorId)
  }

  if (filters?.startDate) {
    query = query.gte('claimed_at', filters.startDate)
  }

  if (filters?.endDate) {
    query = query.lte('claimed_at', filters.endDate)
  }

  const { data, error } = await query

  if (error) throw error
  return data || []
}

