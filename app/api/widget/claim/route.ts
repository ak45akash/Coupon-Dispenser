import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { claimCoupon } from '@/lib/db/coupons'
import { getUserByEmail, getUserById } from '@/lib/db/users'

const widgetClaimSchema = z.object({
  coupon_id: z.string().uuid('Invalid coupon ID'),
  user_id: z.string().uuid('Invalid user ID').optional(),
  user_email: z.string().email('Invalid email').optional(),
})

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
      return NextResponse.json(
        { success: false, error: 'user_id or user_email is required for widget claims' },
        { status: 400 }
      )
    }

    let userId: string

    if (validatedData.user_id) {
      // Use user_id directly
      const user = await getUserById(validatedData.user_id)
      if (!user) {
        return NextResponse.json(
          { success: false, error: 'User not found' },
          { status: 404 }
        )
      }
      userId = user.id
    } else if (validatedData.user_email) {
      // Find user by email
      const user = await getUserByEmail(validatedData.user_email)
      if (!user) {
        return NextResponse.json(
          { success: false, error: 'User not found. Please ensure you have an account.' },
          { status: 404 }
        )
      }
      userId = user.id
    } else {
      return NextResponse.json(
        { success: false, error: 'User identification required' },
        { status: 400 }
      )
    }

    // Claim the coupon
    const coupon = await claimCoupon(userId, validatedData.coupon_id)

    return NextResponse.json({
      success: true,
      data: {
        id: coupon.id,
        code: coupon.code,
        description: coupon.description,
        discount_value: coupon.discount_value,
      },
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

