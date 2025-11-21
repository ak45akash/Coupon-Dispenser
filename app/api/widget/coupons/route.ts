import { NextRequest, NextResponse } from 'next/server'
import { getAvailableCouponsByVendor } from '@/lib/db/coupons'
import { z } from 'zod'

const widgetCouponsSchema = z.object({
  vendor_id: z.string().uuid('Invalid vendor ID'),
})

/**
 * Public widget endpoint to fetch available coupons for a vendor
 * This endpoint is designed for external widget usage and doesn't require authentication
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const vendorId = searchParams.get('vendor_id')

    if (!vendorId) {
      return NextResponse.json(
        { success: false, error: 'vendor_id is required' },
        { status: 400 }
      )
    }

    // Validate vendor_id format
    try {
      widgetCouponsSchema.parse({ vendor_id: vendorId })
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid vendor ID format' },
        { status: 400 }
      )
    }

    // Get available (unclaimed) coupons for this vendor
    const coupons = await getAvailableCouponsByVendor(vendorId)

    return NextResponse.json({
      success: true,
      data: coupons,
      count: coupons.length,
    })
  } catch (error) {
    console.error('Error fetching widget coupons:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

