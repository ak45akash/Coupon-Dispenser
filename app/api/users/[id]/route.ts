import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getUserById } from '@/lib/db/users'
import { canManageUsers } from '@/lib/auth/permissions'
import { supabaseAdmin } from '@/lib/supabase/server'
import { getNextAvailableClaimDate } from '@/lib/db/coupons'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !canManageUsers(session.user.role)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      )
    }

    const { id } = await params
    const user = await getUserById(id)

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Get additional user details from auth.users (phone, last_sign_in_at, etc.)
    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(id)
    const authUserData = authUser?.user || null
    const phone = authUserData?.phone || null
    const lastSignInAt = authUserData?.last_sign_in_at || null
    const emailConfirmed = authUserData?.email_confirmed_at ? true : false

    // Get user's claim history
    const { data: claimHistory, error: claimError } = await supabaseAdmin
      .from('claim_history')
      .select(`
        *,
        coupon:coupons(id, code, description, discount_value, vendor_id, expiry_date),
        vendor:vendors(id, name)
      `)
      .eq('user_id', id)
      .order('claimed_at', { ascending: false })

    if (claimError) {
      console.error('Error fetching claim history:', claimError)
    }

    // For each claim, get the next available claim date for that vendor
    const claimHistoryWithNextDate = await Promise.all(
      (claimHistory || []).map(async (claim: any) => {
        const nextAvailableDate = await getNextAvailableClaimDate(
          id,
          claim.vendor_id
        )
        const canClaimNow = nextAvailableDate === null
        
        // Calculate days remaining
        let daysRemaining: number | null = null
        let timeRemainingText = 'Available Now'
        
        if (!canClaimNow && nextAvailableDate) {
          const nextDate = new Date(nextAvailableDate)
          const now = new Date()
          daysRemaining = Math.ceil((nextDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          
          if (daysRemaining > 0) {
            timeRemainingText = `${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} remaining`
          } else {
            timeRemainingText = 'Available Now'
          }
        }
        
        return {
          ...claim,
          next_available_claim_date: nextAvailableDate,
          can_claim_now: canClaimNow,
          days_remaining: daysRemaining,
          time_remaining_text: timeRemainingText,
        }
      })
    )

    // Get claim statistics
    const { count: totalClaims } = await supabaseAdmin
      .from('claim_history')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', id)

    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const { count: thisMonthClaims } = await supabaseAdmin
      .from('claim_history')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', id)
      .gte('claimed_at', startOfMonth.toISOString())

    // Get unique vendors claimed from
    const { data: uniqueVendors } = await supabaseAdmin
      .from('claim_history')
      .select('vendor_id')
      .eq('user_id', id)

    const uniqueVendorCount = new Set(uniqueVendors?.map((c: any) => c.vendor_id) || []).size

    // Get partner vendor access if partner admin
    let vendorAccess: Array<{
      vendor_id: string
      vendor: {
        id: string
        name: string
      }
    }> = []
    if (user.role === 'partner_admin') {
      const { data: access } = await supabaseAdmin
        .from('partner_vendor_access')
        .select(`
          vendor_id,
          vendor:vendors(id, name)
        `)
        .eq('user_id', id)

      // Transform the nested vendor data
      vendorAccess = ((access || []) as any[]).map((item: any) => ({
        vendor_id: item.vendor_id,
        vendor: Array.isArray(item.vendor) ? item.vendor[0] : item.vendor,
      })).filter((item) => item.vendor != null)
    }

    return NextResponse.json({
      success: true,
      data: {
        user: {
          ...user,
          phone,
          last_sign_in_at: lastSignInAt,
          email_confirmed: emailConfirmed,
        },
        stats: {
          total_claims: totalClaims || 0,
          this_month_claims: thisMonthClaims || 0,
          unique_vendors: uniqueVendorCount,
        },
        claim_history: claimHistoryWithNextDate,
        vendor_access: vendorAccess,
      },
    })
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
