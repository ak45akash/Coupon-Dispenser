import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { extractWidgetSession } from '@/lib/jwt/widget-session'
import { atomicClaimCoupon } from '@/lib/db/coupons'
import { supabaseAdmin } from '@/lib/supabase/server'

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

    // Log claim attempt for debugging
    const isAnonymous = session.user_id.startsWith('anon_') || session.user_id.startsWith('anonymous-')
    console.log(`[claim] Attempting claim: coupon=${validatedData.coupon_id}, user=${session.user_id} (anonymous: ${isAnonymous}), vendor=${session.vendor_id}`)
    
    // Attempt atomic claim
    try {
      const result = await atomicClaimCoupon(session.user_id, validatedData.coupon_id)

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

