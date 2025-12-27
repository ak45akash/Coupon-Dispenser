import { NextRequest, NextResponse } from 'next/server'
import { extractWidgetSession } from '@/lib/jwt/widget-session'
import { getCouponsByVendor } from '@/lib/db/coupons'
import { supabaseAdmin } from '@/lib/supabase/server'
import { getVendorById } from '@/lib/db/vendors'
import { upsertUserFromExternalId } from '@/lib/db/users'

/**
 * Helper function to add CORS headers to responses
 */
function addCorsHeaders(response: NextResponse): NextResponse {
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  // Prevent cross-user caching of personalized responses (includes claimed coupon state).
  response.headers.set('Cache-Control', 'no-store')
  response.headers.set('Vary', 'Authorization')
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
    
    if (!authHeader) {
      console.error('[available-coupons] Missing Authorization header')
      return addCorsHeaders(
        NextResponse.json(
          { success: false, error: 'Unauthorized: Widget session token required' },
          { status: 401 }
        )
      )
    }
    
    let session
    try {
      session = extractWidgetSession(authHeader)
    } catch (error) {
      console.error('[available-coupons] Error extracting widget session:', {
        error: error instanceof Error ? error.message : String(error),
        authHeaderPrefix: authHeader.substring(0, 20) + '...',
      })
      return addCorsHeaders(
        NextResponse.json(
          { success: false, error: 'Invalid widget session token' },
          { status: 401 }
        )
      )
    }

    if (!session) {
      console.error('[available-coupons] Failed to extract session from token')
      return addCorsHeaders(
        NextResponse.json(
          { success: false, error: 'Unauthorized: Widget session token required' },
          { status: 401 }
        )
      )
    }
    
    console.log(`[available-coupons] Session extracted: user=${session.user_id.substring(0, 20)}..., vendor=${session.vendor_id}`)

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

    // Ensure internal UUID user_id for DB reads (monthly enforcement).
    // If token contains a non-UUID external id (e.g. WordPress `user_ref`), map it.
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    let internalUserId = userId
    if (!uuidRegex.test(internalUserId)) {
      try {
        const mappedUser = await upsertUserFromExternalId(session.vendor_id, internalUserId)
        internalUserId = mappedUser.id
      } catch (e) {
        console.error('[available-coupons] Failed to map external user id to internal UUID:', {
          vendorId,
          externalUserIdPrefix: String(userId).substring(0, 20) + '...',
          error: e instanceof Error ? e.message : String(e),
        })
        return addCorsHeaders(
          NextResponse.json(
            { success: false, error: 'Authentication required. Only logged-in users can access coupons.' },
            { status: 401 }
          )
        )
      }
    }
    
    // Reject anonymous users - only logged-in users are allowed
    const isAnonymousUserId = (id: string): boolean => {
      return id.startsWith('anon_') || id.startsWith('anonymous-')
    }
    
    if (isAnonymousUserId(userId)) {
      console.error('[available-coupons] Rejected anonymous user:', userId.substring(0, 20) + '...')
      return addCorsHeaders(
        NextResponse.json(
          { success: false, error: 'Authentication required. Only logged-in users can access coupons.' },
          { status: 401 }
        )
      )
    }
    
    // Log request for debugging
    console.log(`[available-coupons] Fetching coupons for vendor: ${vendorId}, user: ${userId}`)

    // Vendor details (to keep response shape compatible with legacy widget endpoint)
    const vendor = await getVendorById(vendorId)
    if (!vendor) {
      return addCorsHeaders(
        NextResponse.json(
          { success: false, error: 'Vendor not found' },
          { status: 404 }
        )
      )
    }
    
    // Calculate current month in YYYYMM format
    const now = new Date()
    const currentMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}` // YYYYMM
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    startOfMonth.setHours(0, 0, 0, 0)

    // Check if user already claimed a coupon this month for this vendor
    let userAlreadyClaimed = false
    try {
      const { data: existingClaim, error: claimError } = await supabaseAdmin
        .from('claim_history')
        .select('coupon_id, claimed_at')
        .eq('vendor_id', vendorId)
        .eq('user_id', internalUserId)
        // Use claimed_at range instead of claim_month equality to support older DB schemas
        // where claim_month may still be DATE (migration not applied).
        .gte('claimed_at', startOfMonth.toISOString())
        .limit(1)
        .maybeSingle()

      if (claimError) {
        console.error('[available-coupons] Error checking existing claim:', {
          error: claimError.message,
          userId,
          vendorId,
          currentMonth,
        })
        // Don't fail coupon loading if claim history query fails (prevents widget from breaking).
        // Monthly enforcement still happens in /api/claim.
        userAlreadyClaimed = false
      } else {
        userAlreadyClaimed = existingClaim !== null
      }
    } catch (error) {
      console.error('[available-coupons] Exception checking existing claim:', {
        error: error instanceof Error ? error.message : String(error),
        userId,
        vendorId,
      })
      // Continue - don't block coupon fetching if claim check fails
    }
    // If user already claimed this month, we still return coupons, but the UI will disable claiming.


    // Determine active claim (visible for 30 days) so the UI can show the claimed coupon and disable others.
    // Prefer `expiry_date` (newer claims), fall back to `claimed_at` (older claims missing expiry_date).
    const thirtyDaysAgo = new Date(now)
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    let activeClaimCoupon: any = null
    {
      const { data } = await supabaseAdmin
        .from('coupons')
        .select('id, code, claimed_at, expiry_date, description, discount_value')
        .eq('vendor_id', vendorId)
        .eq('claimed_by', internalUserId)
        .eq('is_claimed', true)
        .is('deleted_at', null)
        .gte('expiry_date', now.toISOString())
        .order('claimed_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      activeClaimCoupon = data || null
    }

    if (!activeClaimCoupon) {
      const { data } = await supabaseAdmin
        .from('coupons')
        .select('id, code, claimed_at, expiry_date, description, discount_value')
        .eq('vendor_id', vendorId)
        .eq('claimed_by', internalUserId)
        .eq('is_claimed', true)
        .is('deleted_at', null)
        .gte('claimed_at', thirtyDaysAgo.toISOString())
        .order('claimed_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      activeClaimCoupon = data || null
    }

    const hasActiveClaim = !!activeClaimCoupon
    const activeClaimExpiry =
      activeClaimCoupon?.expiry_date ||
      (activeClaimCoupon?.claimed_at
        ? new Date(new Date(activeClaimCoupon.claimed_at).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
        : null)
    // Get all coupons for this vendor
    let allCoupons
    try {
      allCoupons = await getCouponsByVendor(vendorId)
      console.log(`[available-coupons] Retrieved ${allCoupons.length} coupons for vendor ${vendorId}`)
    } catch (error) {
      console.error('[available-coupons] Error fetching coupons:', {
        error: error instanceof Error ? error.message : String(error),
        vendorId,
        stack: error instanceof Error ? error.stack : undefined,
      })
      throw error
    }

    // Filter available coupons:
    // 1. Not soft-deleted
    // 2. Either unclaimed OR claimed by this user
    // Claimed coupons are only visible to the user who claimed them
    const availableCoupons = allCoupons
      .filter((coupon) => !coupon.deleted_at)
      .filter((coupon) => {
        if (!coupon.is_claimed) return true
        if (coupon.claimed_by !== internalUserId) return false

        // Only show the user's claimed coupon while it's active (30 days).
        if (coupon.expiry_date) {
          return new Date(coupon.expiry_date).getTime() >= now.getTime()
        }
        if (coupon.claimed_at) {
          return new Date(coupon.claimed_at).getTime() >= thirtyDaysAgo.getTime()
        }
        return false
      })
      .map((coupon) => ({
        id: coupon.id,
        // Only include code for the active claimed coupon (prevents leaking unclaimed codes).
        code: activeClaimCoupon && activeClaimCoupon.id === coupon.id ? coupon.code : null,
        description: coupon.description,
        discount_value: coupon.discount_value,
        is_claimed: coupon.is_claimed || false,
        claimed_at: coupon.claimed_at || null,
        expiry_date: coupon.expiry_date || null,
      }))
    

    // If the active claimed coupon isn't in the list for any reason, ensure it is included.
    if (activeClaimCoupon && !availableCoupons.some((c) => c.id === activeClaimCoupon.id)) {
      availableCoupons.unshift({
        id: activeClaimCoupon.id,
        code: activeClaimCoupon.code || null,
        description: activeClaimCoupon.description || null,
        discount_value: activeClaimCoupon.discount_value || null,
        is_claimed: true,
        claimed_at: activeClaimCoupon.claimed_at || null,
        expiry_date: activeClaimCoupon.expiry_date || activeClaimExpiry,
      })
    }

    console.log(`[available-coupons] Returning ${availableCoupons.length} available coupons`)

    return addCorsHeaders(
      NextResponse.json({
        success: true,
        data: {
          vendor: {
            id: vendor.id,
            name: vendor.name,
            description: vendor.description,
            website: vendor.website,
            logo_url: vendor.logo_url,
          },
          coupons: availableCoupons,
          has_active_claim: hasActiveClaim || userAlreadyClaimed,
          active_claim_expiry: activeClaimExpiry,
          user_already_claimed: userAlreadyClaimed,
          claim_month: currentMonth,
        },
        count: availableCoupons.length,
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

