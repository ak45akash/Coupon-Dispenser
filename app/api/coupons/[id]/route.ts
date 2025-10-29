import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getCouponById, deleteCoupon } from '@/lib/db/coupons'
import { softDeleteCoupon } from '@/lib/db/trash'
import { canManageCoupons, isPartnerAdmin } from '@/lib/auth/permissions'
import { getVendorByPartner, hasVendorAccess } from '@/lib/db/vendors'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    const coupon = await getCouponById(id)

    if (!coupon) {
      return NextResponse.json(
        { success: false, error: 'Coupon not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: coupon })
  } catch (error) {
    console.error('Error fetching coupon:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !canManageCoupons(session.user.role)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      )
    }

    const { id } = await params
    
    // Get the coupon to check vendor access
    const coupon = await getCouponById(id)
    if (!coupon) {
      return NextResponse.json(
        { success: false, error: 'Coupon not found' },
        { status: 404 }
      )
    }

    // If partner admin, verify they have access to this coupon's vendor
    if (isPartnerAdmin(session.user.role)) {
      const hasAccess = await hasVendorAccess(session.user.id, coupon.vendor_id)
      if (!hasAccess) {
        return NextResponse.json(
          { success: false, error: 'You can only delete coupons for your assigned vendor' },
          { status: 403 }
        )
      }
    }
    
    // Soft delete the coupon (moves to trash)
    await softDeleteCoupon(id, session.user.id)

    return NextResponse.json({
      success: true,
      message: 'Coupon moved to trash',
    })
  } catch (error) {
    console.error('Error deleting coupon:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

