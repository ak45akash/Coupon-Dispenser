import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getCouponClaimHistory, getCouponClaimStats, getNextAvailableClaimDate } from '@/lib/db/coupons'
import { getCouponById } from '@/lib/db/coupons'
import { canManageCoupons, isPartnerAdmin } from '@/lib/auth/permissions'
import { hasVendorAccess } from '@/lib/db/vendors'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    
    // Verify coupon exists
    const coupon = await getCouponById(id)
    if (!coupon) {
      return NextResponse.json(
        { success: false, error: 'Coupon not found' },
        { status: 404 }
      )
    }

    // Check permissions - partner admins can only view claims for their vendors
    if (isPartnerAdmin(session.user.role)) {
      const hasAccess = await hasVendorAccess(session.user.id, coupon.vendor_id)
      if (!hasAccess) {
        return NextResponse.json(
          { success: false, error: 'Access denied' },
          { status: 403 }
        )
      }
    }

    // Get claim history
    const claimHistory = await getCouponClaimHistory(id)
    
    // Get statistics
    const stats = await getCouponClaimStats(id)

    // Calculate next available claim date for each user
    const claimHistoryWithNextDate = await Promise.all(
      claimHistory.map(async (claim: any) => {
        const nextAvailableDate = await getNextAvailableClaimDate(
          claim.user_id,
          claim.vendor_id
        )
        return {
          ...claim,
          next_available_claim_date: nextAvailableDate,
          can_claim_now: nextAvailableDate === null,
        }
      })
    )

    return NextResponse.json({
      success: true,
      data: {
        coupon: {
          id: coupon.id,
          code: coupon.code,
          description: coupon.description,
          discount_value: coupon.discount_value,
        },
        stats,
        claims: claimHistoryWithNextDate,
      },
    })
  } catch (err: any) {
    console.error('Error fetching coupon claim history:', err)
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

