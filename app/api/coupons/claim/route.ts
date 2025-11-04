import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { claimCouponSchema } from '@/lib/validators/coupon'
import { claimCoupon } from '@/lib/db/coupons'
import { getUserByEmail } from '@/lib/db/users'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    const body = await request.json()
    const validatedData = claimCouponSchema.parse(body)

    let userId: string

    // If user_email is provided (for widget/API usage), find user by email
    if (validatedData.user_email) {
      const user = await getUserByEmail(validatedData.user_email)
      if (!user) {
        return NextResponse.json(
          { success: false, error: 'User not found' },
          { status: 404 }
        )
      }
      userId = user.id
    } else if (session) {
      // Use authenticated user
      userId = session.user.id
    } else {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const coupon = await claimCoupon(userId, validatedData.coupon_id)

    return NextResponse.json({
      success: true,
      data: coupon,
      message: 'Coupon claimed successfully',
    })
  } catch (error: any) {
    console.error('Error claiming coupon:', error)

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

