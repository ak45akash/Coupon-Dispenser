import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { extractWidgetSession } from '@/lib/jwt/widget-session'
import { atomicClaimCoupon } from '@/lib/db/coupons'
import { upsertUserFromExternalId } from '@/lib/db/users'

const claimSchema = z.object({
  coupon_id: z.string().uuid('Invalid coupon ID'),
})

/**
 * Helper function to add CORS headers to responses
 */
function addCorsHeaders(response: NextResponse): NextResponse {
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  // Prevent caching of claim responses.
  response.headers.set('Cache-Control', 'no-store')
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
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}

/**
 * POST /api/claim
 * 
 * Atomically claims a coupon for the authenticated widget user.
 * 
 * Authentication: Bearer widget session token
 * 
 * Constraints enforced:
 * - Unique (coupon_id, claim_month) - one user per coupon per month
 * - Unique (vendor_id, user_id, claim_month) - one coupon per user per vendor per month
 * 
 * Returns:
 * - 200: { success: true, coupon_code: string }
 * - 409: { error: 'COUPON_ALREADY_CLAIMED' | 'USER_ALREADY_CLAIMED' }
 */
export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const validatedData = claimSchema.parse(body)

    // Ensure we have an internal UUID user_id for DB writes.
    // Some integrations (e.g. WordPress plugin) use a stable pseudonymous `user_ref` (non-UUID).
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    let internalUserId = session.user_id
    if (!uuidRegex.test(internalUserId)) {
      try {
        const mappedUser = await upsertUserFromExternalId(session.vendor_id, internalUserId)
        internalUserId = mappedUser.id
      } catch (e) {
        console.error('[claim] Failed to map external user id to internal UUID:', {
          vendorId: session.vendor_id,
          externalUserIdPrefix: String(session.user_id).substring(0, 20) + '...',
          error: e instanceof Error ? e.message : String(e),
        })
        return addCorsHeaders(
          NextResponse.json(
            { success: false, error: 'Authentication required. Only logged-in users can claim coupons.' },
            { status: 401 }
          )
        )
      }
    }

    // Reject anonymous users - only logged-in users can claim coupons
    const isAnonymousUserId = (id: string): boolean => {
      return id.startsWith('anon_') || id.startsWith('anonymous-')
    }
    
    if (isAnonymousUserId(session.user_id)) {
      console.error('[claim] Rejected anonymous user:', session.user_id.substring(0, 20) + '...')
      return addCorsHeaders(
        NextResponse.json(
          { success: false, error: 'Authentication required. Only logged-in users can claim coupons.' },
          { status: 401 }
        )
      )
    }
    
    // Log claim attempt for debugging
    console.log(`[claim] Attempting claim: coupon=${validatedData.coupon_id}, user=${internalUserId}, vendor=${session.vendor_id}`)
    
    // Attempt atomic claim
    try {
      const result = await atomicClaimCoupon(internalUserId, validatedData.coupon_id)

      // Optional: Log claim event (non-blocking)
      try {
        // You can add an events table here if needed
        // await logClaimEvent(session.user_id, validatedData.coupon_id, session.vendor_id)
      } catch (logError) {
        // Don't fail the claim if logging fails
        console.error('Error logging claim event:', logError)
      }

      // Optional: Dispatch webhook (non-blocking)
      try {
        // You can add webhook dispatch here if needed
        // await dispatchWebhook(session.vendor_id, { type: 'claim_success', ... })
      } catch (webhookError) {
        // Don't fail the claim if webhook fails
        console.error('Error dispatching webhook:', webhookError)
      }

      return addCorsHeaders(
        NextResponse.json({
          success: true,
          coupon_code: result.coupon_code,
        })
      )
    } catch (error: any) {
      // Handle specific error types
      if (error.message === 'COUPON_ALREADY_CLAIMED') {
        return addCorsHeaders(
          NextResponse.json(
            { success: false, error: 'COUPON_ALREADY_CLAIMED' },
            { status: 409 }
          )
        )
      }

      if (error.message === 'USER_ALREADY_CLAIMED') {
        return addCorsHeaders(
          NextResponse.json(
            { success: false, error: 'USER_ALREADY_CLAIMED' },
            { status: 409 }
          )
        )
      }

      if (error.message === 'Coupon not found') {
        return addCorsHeaders(
          NextResponse.json(
            { success: false, error: 'Coupon not found' },
            { status: 404 }
          )
        )
      }

      // Re-throw other errors to be caught by outer catch
      throw error
    }
  } catch (error: any) {
    console.error('[claim] Error in claim endpoint:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      couponId: request.body ? 'present' : 'missing',
      authHeader: request.headers.get('authorization') ? 'present' : 'missing',
    })

    if (error.name === 'ZodError') {
      return addCorsHeaders(
        NextResponse.json(
          { success: false, error: 'Validation error', details: error.errors },
          { status: 400 }
        )
      )
    }

    return addCorsHeaders(
      NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      )
    )
  }
}

