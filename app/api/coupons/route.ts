import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createCouponSchema, bulkCreateCouponsSchema } from '@/lib/validators/coupon'
import {
  getAllCoupons,
  getCouponsByVendor,
  createCoupon,
  bulkCreateCoupons,
} from '@/lib/db/coupons'
import { canManageCoupons } from '@/lib/auth/permissions'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const vendorId = searchParams.get('vendor_id')

    const coupons = vendorId
      ? await getCouponsByVendor(vendorId)
      : await getAllCoupons()

    return NextResponse.json({ success: true, data: coupons })
  } catch (error) {
    console.error('Error fetching coupons:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !canManageCoupons(session.user.role)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      )
    }

    const body = await request.json()

    // Check if it's a bulk create or single create
    if (body.coupons && Array.isArray(body.coupons)) {
      const validatedData = bulkCreateCouponsSchema.parse(body)
      const coupons = await bulkCreateCoupons(validatedData, session.user.id)

      return NextResponse.json(
        {
          success: true,
          data: coupons,
          message: `${coupons.length} coupons created successfully`,
        },
        { status: 201 }
      )
    } else {
      const validatedData = createCouponSchema.parse(body)
      const coupon = await createCoupon(validatedData, session.user.id)

      return NextResponse.json(
        { success: true, data: coupon, message: 'Coupon created successfully' },
        { status: 201 }
      )
    }
  } catch (error: any) {
    console.error('Error creating coupon:', error)

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

