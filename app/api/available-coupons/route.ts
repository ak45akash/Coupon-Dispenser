import { NextRequest, NextResponse } from 'next/server'
import { extractWidgetSession } from '@/lib/jwt/widget-session'
import { getCouponsByVendor } from '@/lib/db/coupons'
import { supabaseAdmin } from '@/lib/supabase/server'

/**
 * GET /api/available-coupons?vendor={vendor_id}
 * 
 * Returns coupons available for claiming by the authenticated widget user.
 * 
 * Authentication: Bearer widget session token
 * 
 * Filters:
 * - Belongs to vendor_id
 * - Is active (not soft-deleted)
 * - Is not already claimed for current claim_month
 * - Respects monthly claim limits (1 coupon per vendor per user per month)
 * 
 * Returns:
 * - List of available coupons
 * - Flag indicating if user already claimed this month
 */
export async function GET(request: NextRequest) {
  try {
    // Extract widget session from Authorization header
    const authHeader = request.headers.get('authorization')
    const session = extractWidgetSession(authHeader)

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Widget session token required' },
        { status: 401 }
      )
    }

    // Get vendor_id from query params
    const searchParams = request.nextUrl.searchParams
    const vendorId = searchParams.get('vendor')

    if (!vendorId) {
      return NextResponse.json(
        { success: false, error: 'vendor query parameter is required' },
        { status: 400 }
      )
    }

    // Validate vendor_id matches session
    if (session.vendor_id !== vendorId) {
      return NextResponse.json(
        { success: false, error: 'Vendor ID mismatch' },
        { status: 403 }
      )
    }

    const userId = session.user_id
    // Calculate current month in YYYYMM format
    const now = new Date()
    const currentMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}` // YYYYMM

    // Check if user already claimed a coupon this month for this vendor
    const { data: existingClaim, error: claimError } = await supabaseAdmin
      .from('claim_history')
      .select('coupon_id, claimed_at')
      .eq('vendor_id', vendorId)
      .eq('user_id', userId)
      .eq('claim_month', currentMonth)
      .limit(1)
      .maybeSingle()

    if (claimError) {
      console.error('Error checking existing claim:', claimError)
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      )
    }

    const userAlreadyClaimed = existingClaim !== null

    // If user already claimed, return empty list with flag
    if (userAlreadyClaimed) {
      return NextResponse.json({
        success: true,
        data: {
          coupons: [],
          user_already_claimed: true,
          claim_month: currentMonth,
        },
      })
    }

    // Get all coupons for this vendor
    const allCoupons = await getCouponsByVendor(vendorId)

    // Filter available coupons:
    // 1. Not soft-deleted
    // 2. Not permanently claimed (is_claimed = false)
    // Once a coupon is claimed, it's permanently unavailable to all users
    const availableCoupons = allCoupons
      .filter((coupon) => !coupon.deleted_at)
      .filter((coupon) => !coupon.is_claimed) // Permanently unavailable if claimed
      .map((coupon) => ({
        id: coupon.id,
        title: coupon.description || 'Coupon',
        summary: coupon.discount_value || '',
        code: coupon.code,
        is_claimed_by_user: false, // User hasn't claimed this specific coupon
        schedule_info: {
          start_at: null, // Can be extended if coupons have start/end dates
          end_at: coupon.expiry_date || null,
        },
      }))

    return NextResponse.json({
      success: true,
      data: {
        coupons: availableCoupons,
        user_already_claimed: false,
        claim_month: currentMonth,
      },
    })
  } catch (error: any) {
    console.error('Error in available-coupons:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

