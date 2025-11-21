import { NextRequest, NextResponse } from 'next/server'
import { claimCouponSchema } from '@/lib/validators/coupon'
import { claimCoupon } from '@/lib/db/coupons'
import { getUserByEmail } from '@/lib/db/users'

/**
 * Public widget endpoint for claiming coupons
 * This endpoint is designed for external widget usage
 * Rate limiting should be implemented at the infrastructure level
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = claimCouponSchema.parse(body)

    // user_email is required for widget claims
    if (!validatedData.user_email) {
      return NextResponse.json(
        { success: false, error: 'user_email is required for widget claims' },
        { status: 400 }
      )
    }

    // Find user by email
    const user = await getUserByEmail(validatedData.user_email)
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found. Please ensure you have an account.' },
        { status: 404 }
      )
    }

    // Claim the coupon
    const coupon = await claimCoupon(user.id, validatedData.coupon_id)

    return NextResponse.json({
      success: true,
      data: coupon,
      message: 'Coupon claimed successfully',
    })
  } catch (error: any) {
    console.error('Error claiming coupon via widget:', error)

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    if (error.message === 'Coupon has already been claimed') {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 409 }
      )
    }

    if (error.message === 'Coupon not found') {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

