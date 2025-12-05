import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { extractWidgetSession } from '@/lib/jwt/widget-session'
import { atomicClaimCoupon } from '@/lib/db/coupons'
import { supabaseAdmin } from '@/lib/supabase/server'

const claimSchema = z.object({
  coupon_id: z.string().uuid('Invalid coupon ID'),
})

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
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Widget session token required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = claimSchema.parse(body)

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

      return NextResponse.json({
        success: true,
        coupon_code: result.coupon_code,
      })
    } catch (error: any) {
      // Handle specific error types
      if (error.message === 'COUPON_ALREADY_CLAIMED') {
        return NextResponse.json(
          { success: false, error: 'COUPON_ALREADY_CLAIMED' },
          { status: 409 }
        )
      }

      if (error.message === 'USER_ALREADY_CLAIMED') {
        return NextResponse.json(
          { success: false, error: 'USER_ALREADY_CLAIMED' },
          { status: 409 }
        )
      }

      if (error.message === 'Coupon not found') {
        return NextResponse.json(
          { success: false, error: 'Coupon not found' },
          { status: 404 }
        )
      }

      // Re-throw other errors to be caught by outer catch
      throw error
    }
  } catch (error: any) {
    console.error('Error in claim endpoint:', error)

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

