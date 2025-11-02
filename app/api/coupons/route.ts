import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createCouponSchema, bulkCreateCouponsSchema } from '@/lib/validators/coupon'
import {
  getAllCoupons,
  getAllCouponsWithClaimCount,
  getCouponsByVendor,
  createCoupon,
  bulkCreateCoupons,
} from '@/lib/db/coupons'
import { canManageCoupons, isSuperAdmin, isPartnerAdmin } from '@/lib/auth/permissions'
import { getVendorByPartner, hasVendorAccess } from '@/lib/db/vendors'

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

    // If partner admin, only show their vendor's coupons
    if (isPartnerAdmin(session.user.role)) {
      const vendor = await getVendorByPartner(session.user.id)
      if (!vendor) {
        return NextResponse.json(
          { success: false, error: 'No vendor associated with this account' },
          { status: 404 }
        )
      }
      // Override vendorId to only show their vendor's coupons
      const coupons = await getCouponsByVendor(vendor.id)
      return NextResponse.json({ success: true, data: coupons })
    }

    // Super admin can see all or filtered by vendor_id
    // Include claim counts for the main coupons page
    const coupons = vendorId
      ? await getCouponsByVendor(vendorId)
      : await getAllCouponsWithClaimCount()

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

    // If partner admin, ensure they can only create coupons for their vendor
    if (isPartnerAdmin(session.user.role)) {
      const vendor = await getVendorByPartner(session.user.id)
      if (!vendor) {
        return NextResponse.json(
          { success: false, error: 'No vendor associated with this account' },
          { status: 404 }
        )
      }

      // Check if it's a bulk create or single create
      if (body.coupons && Array.isArray(body.coupons)) {
        // Ensure all coupons belong to their vendor
        const invalidCoupons = body.coupons.filter((c: any) => c.vendor_id !== vendor.id)
        if (invalidCoupons.length > 0) {
          return NextResponse.json(
            { success: false, error: 'You can only create coupons for your assigned vendor' },
            { status: 403 }
          )
        }
      } else {
        // Ensure single coupon belongs to their vendor
        if (body.vendor_id && body.vendor_id !== vendor.id) {
          return NextResponse.json(
            { success: false, error: 'You can only create coupons for your assigned vendor' },
            { status: 403 }
          )
        }
        // Auto-assign vendor if not provided
        body.vendor_id = vendor.id
      }
    }

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

