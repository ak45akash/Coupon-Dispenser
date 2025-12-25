import { NextRequest, NextResponse } from 'next/server'
import { extractWidgetSession } from '@/lib/jwt/widget-session'
import { getCouponsByVendor } from '@/lib/db/coupons'
import { supabaseAdmin } from '@/lib/supabase/server'

/**
 * Helper function to add CORS headers to responses
 */
function addCorsHeaders(response: NextResponse): NextResponse {
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  return response
}

/**
 * Handle CORS preflight requests
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}

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
      return addCorsHeaders(
        NextResponse.json(
          { success: false, error: 'Unauthorized: Widget session token required' },
          { status: 401 }
        )
      )
    }

    // Get vendor_id from query params
    const searchParams = request.nextUrl.searchParams
    const vendorId = searchParams.get('vendor')

    if (!vendorId) {
      return addCorsHeaders(
        NextResponse.json(
          { success: false, error: 'vendor query parameter is required' },
          { status: 400 }
        )
      )
    }

    // Validate vendor_id matches session
    if (session.vendor_id !== vendorId) {
      return addCorsHeaders(
        NextResponse.json(
          { success: false, error: 'Vendor ID mismatch' },
          { status: 403 }
        )
      )
    }

    const userId = session.user_id
    
    // Helper function to check if user ID is anonymous
    const isAnonymousUserId = (id: string): boolean => {
      return id.startsWith('anon_') || id.startsWith('anonymous-')
    }
    
    const isAnonymous = isAnonymousUserId(userId)
    
    // Log request for debugging
    console.log(`[available-coupons] Fetching coupons for vendor: ${vendorId}, user: ${userId} (anonymous: ${isAnonymous})`)
    
    // Calculate current month in YYYYMM format
    const now = new Date()
    const currentMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}` // YYYYMM

    // Check if user already claimed a coupon this month for this vendor
    // Skip this check for anonymous users since they don't exist in claim_history (foreign key constraint)
    let userAlreadyClaimed = false
    if (!isAnonymous) {
      try {
        const { data: existingClaim, error: claimError } = await supabaseAdmin
          .from('claim_history')
          .select('coupon_id, claimed_at')
          .eq('vendor_id', vendorId)
          .eq('user_id', userId)
          .eq('claim_month', currentMonth)
          .limit(1)
          .maybeSingle()

        if (claimError) {
          console.error('[available-coupons] Error checking existing claim:', {
            error: claimError.message,
            userId,
            vendorId,
            currentMonth,
          })
          return addCorsHeaders(
            NextResponse.json(
              { success: false, error: 'Internal server error' },
              { status: 500 }
            )
          )
        }

        userAlreadyClaimed = existingClaim !== null
      } catch (error) {
        console.error('[available-coupons] Exception checking existing claim:', {
          error: error instanceof Error ? error.message : String(error),
          userId,
          vendorId,
        })
        // Continue - don't block coupon fetching if claim check fails
      }
    } else {
      console.log(`[available-coupons] Skipping claim_history check for anonymous user: ${userId}`)
    }

    // If user already claimed, return empty list with flag
    if (userAlreadyClaimed) {
      return addCorsHeaders(
        NextResponse.json({
          success: true,
          data: {
            coupons: [],
            user_already_claimed: true,
            claim_month: currentMonth,
          },
        })
      )
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

    return addCorsHeaders(
      NextResponse.json({
        success: true,
        data: {
          coupons: availableCoupons,
          user_already_claimed: false,
          claim_month: currentMonth,
        },
      })
    )
  } catch (error: any) {
    console.error('[available-coupons] Error in available-coupons:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      vendorId: request.nextUrl.searchParams.get('vendor'),
      authHeader: request.headers.get('authorization') ? 'present' : 'missing',
    })
    return addCorsHeaders(
      NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      )
    )
  }
}

