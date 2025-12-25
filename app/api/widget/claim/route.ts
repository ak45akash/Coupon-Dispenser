import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { claimCoupon, getUserActiveClaim } from '@/lib/db/coupons'
import { getUserByEmail, getUserById } from '@/lib/db/users'
import { supabaseAdmin } from '@/lib/supabase/server'

const widgetClaimSchema = z.object({
  coupon_id: z.string().uuid('Invalid coupon ID'),
  user_id: z.string().refine(
    (val) => !val || val.startsWith('anon_') || val.startsWith('anonymous-') || /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val),
    'Invalid user ID format'
  ).optional(),
  user_email: z.string().email('Invalid email').optional(),
})

/**
 * Helper function to add CORS headers to responses
 */
function addCorsHeaders(response: NextResponse): NextResponse {
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type')
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
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}

/**
 * Public widget endpoint for claiming coupons
 * This endpoint is designed for external widget usage
 * Accepts either user_id or user_email for user identification
 * Rate limiting should be implemented at the infrastructure level
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = widgetClaimSchema.parse(body)

    // Either user_id or user_email is required
    if (!validatedData.user_id && !validatedData.user_email) {
      return addCorsHeaders(
        NextResponse.json(
          { success: false, error: 'user_id or user_email is required for widget claims' },
          { status: 400 }
        )
      )
    }

    let userId: string | undefined

    if (validatedData.user_id) {
      // Check if it's an anonymous user ID (supports both anon_ and anonymous- prefixes)
      const isAnonymous = validatedData.user_id.startsWith('anon_') || validatedData.user_id.startsWith('anonymous-')
      if (isAnonymous) {
        // For anonymous users, we'll create a guest user or use the anonymous ID directly
        // The claimCoupon function will handle this
        userId = validatedData.user_id
        console.log(`[widget/claim] Using anonymous user ID: ${userId.substring(0, 20)}...`)
      } else {
        // Use user_id directly - must exist in database
        const user = await getUserById(validatedData.user_id)
        if (!user) {
          return addCorsHeaders(
            NextResponse.json(
              { success: false, error: 'User not found' },
              { status: 404 }
            )
          )
        }
        userId = user.id
      }
    } else if (validatedData.user_email) {
      // Find user by email
      const user = await getUserByEmail(validatedData.user_email)
      if (!user) {
        return addCorsHeaders(
          NextResponse.json(
            { success: false, error: 'User not found. Please ensure you have an account.' },
            { status: 404 }
          )
        )
      }
      userId = user.id
    } else {
      return addCorsHeaders(
        NextResponse.json(
          { success: false, error: 'User identification required' },
          { status: 400 }
        )
      )
    }

    // Check if user already has an active claim for this vendor
    // First, get the coupon to find vendor_id
    const { data: couponData } = await supabaseAdmin
      .from('coupons')
      .select('vendor_id')
      .eq('id', validatedData.coupon_id)
      .single()

    if (!couponData) {
      return addCorsHeaders(
        NextResponse.json(
          { success: false, error: 'Coupon not found' },
          { status: 404 }
        )
      )
    }

    // Check for active claim
    // getUserActiveClaim works for both regular users and anonymous users
    // since it checks the claimed_by field in coupons table (which stores the userId/anonymousId)
    const activeClaim = await getUserActiveClaim(userId, couponData.vendor_id)
    
    if (activeClaim && activeClaim.id !== validatedData.coupon_id) {
      return addCorsHeaders(
        NextResponse.json(
          { 
            success: false, 
            error: 'You already have an active coupon. Please wait until it expires (30 days from claim date).',
            active_coupon: {
              id: activeClaim.id,
              code: activeClaim.code,
              expiry_date: activeClaim.expiry_date,
            }
          },
          { status: 409 }
        )
      )
    }

    // Claim the coupon
    const coupon = await claimCoupon(userId, validatedData.coupon_id)

    return addCorsHeaders(
      NextResponse.json({
        success: true,
        data: {
          id: coupon.id,
          code: coupon.code,
          description: coupon.description,
          discount_value: coupon.discount_value,
        },
        message: 'Coupon claimed successfully',
      })
    )
  } catch (error: any) {
    console.error('[widget/claim] Error claiming coupon via widget:', {
      error: error instanceof Error ? error.message : String(error),
      name: error?.name,
      code: error?.code,
      details: error?.details,
      stack: error instanceof Error ? error.stack : undefined,
    })

    if (error.name === 'ZodError') {
      return addCorsHeaders(
        NextResponse.json(
          { success: false, error: 'Validation error', details: error.errors },
          { status: 400 }
        )
      )
    }

    if (error.message === 'Coupon has already been claimed') {
      return addCorsHeaders(
        NextResponse.json(
          { success: false, error: error.message },
          { status: 409 }
        )
      )
    }

    if (error.message === 'Coupon not found') {
      return addCorsHeaders(
        NextResponse.json(
          { success: false, error: error.message },
          { status: 404 }
        )
      )
    }

    // Provide more detailed error message for debugging
    const errorMessage = error?.message || error?.code || 'Internal server error'
    return addCorsHeaders(
      NextResponse.json(
        { 
          success: false, 
          error: errorMessage,
          ...(process.env.NODE_ENV === 'development' && { 
            details: error?.details || error?.stack 
          })
        },
        { status: 500 }
      )
    )
  }
}

