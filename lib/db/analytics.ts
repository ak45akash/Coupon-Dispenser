import { supabaseAdmin } from '@/lib/supabase/server'
import type {
  AnalyticsOverview,
  VendorAnalytics,
  ClaimTrend,
  TopVendor,
} from '@/types/api'
import { startOfMonth, format } from 'date-fns'

export async function getAnalyticsOverview(): Promise<AnalyticsOverview> {
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

  const analyticsPromises = (vendors || []).map(async (vendor) => {
    // Get coupon stats (coupons are shared, so all are available)
    const { count: totalCouponsCount } = await supabaseAdmin
      .from('coupons')
      .select('id', { count: 'exact', head: true })
      .eq('vendor_id', vendor.id)
      .is('deleted_at', null)

    // Get claim stats from claim_history
    const { count: claimedCouponsCount } = await supabaseAdmin
      .from('claim_history')
      .select('id', { count: 'exact', head: true })
      .eq('vendor_id', vendor.id)

    const total_coupons = totalCouponsCount || 0
    const claimed_coupons = claimedCouponsCount || 0 // Total claims for this vendor
    const available_coupons = total_coupons // All coupons are available (shared)
    const claim_rate =
      total_coupons > 0 ? (claimed_coupons / total_coupons) * 100 : 0

    // Get claims by month for the last 12 months
    const twelveMonthsAgo = new Date()
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)

    const { data: claimHistory } = await supabaseAdmin
      .from('claim_history')
      .select('claim_month')
      .eq('vendor_id', vendor.id)
      .gte('claimed_at', twelveMonthsAgo.toISOString())

    // Group by month
    const claimsByMonth = (claimHistory || []).reduce(
      (acc, claim) => {
        const month = claim.claim_month
        acc[month] = (acc[month] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    const claims_by_month = Object.entries(claimsByMonth).map(
      ([month, count]) => ({
        month,
        count,
      })
    )

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

  return Promise.all(analyticsPromises)
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

