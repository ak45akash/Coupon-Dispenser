import { NextRequest, NextResponse } from 'next/server'
import { getAvailableCouponsByVendor, getUserActiveClaim } from '@/lib/db/coupons'
import { getVendorById } from '@/lib/db/vendors'
import { getUserById } from '@/lib/db/users'
import { z } from 'zod'

const widgetCouponsSchema = z.object({
  vendor_id: z.string().uuid('Invalid vendor ID'),
  user_id: z.string().uuid('Invalid user ID').optional(),
})

/**
 * Handle CORS preflight requests
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}

/**
 * Public widget endpoint to fetch available coupons for a vendor with vendor details
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

    // Get vendor information
    const vendor = await getVendorById(vendorId)
    if (!vendor) {
      return NextResponse.json(
        { success: false, error: 'Vendor not found' },
        { status: 404 }
      )
    }

    // Get user_id from query params if provided
    const userId = searchParams.get('user_id')
    
    // Validate user_id if provided
    if (userId) {
      try {
        const user = await getUserById(userId)
        if (!user) {
          return NextResponse.json(
            { success: false, error: 'User not found' },
            { status: 404 }
          )
        }
      } catch (error) {
        return NextResponse.json(
          { success: false, error: 'Invalid user ID format' },
          { status: 400 }
        )
      }
    }

    // Get available coupons for this vendor (respects active claims if user_id provided)
    const coupons = await getAvailableCouponsByVendor(vendorId, userId || undefined)
    
    // Check if user has an active claim
    let activeClaim = null
    let hasActiveClaim = false
    if (userId) {
      activeClaim = await getUserActiveClaim(userId, vendorId)
      hasActiveClaim = activeClaim !== null
    }

    const response = NextResponse.json({
      success: true,
      data: {
        vendor: {
          id: vendor.id,
          name: vendor.name,
          description: vendor.description,
          website: vendor.website,
          logo_url: vendor.logo_url,
        },
        coupons: coupons.map(coupon => ({
          id: coupon.id,
          code: coupon.code,
          description: coupon.description,
          discount_value: coupon.discount_value,
          is_claimed: coupon.is_claimed || false,
          claimed_at: coupon.claimed_at || null,
          expiry_date: coupon.expiry_date || null,
        })),
        has_active_claim: hasActiveClaim,
        active_claim_expiry: activeClaim?.expiry_date || null,
      },
      count: coupons.length,
    })

    // Add CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type')

    return response
  } catch (error) {
    console.error('Error fetching widget coupons:', error)
    const errorResponse = NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
    // Add CORS headers even for errors
    errorResponse.headers.set('Access-Control-Allow-Origin', '*')
    errorResponse.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS')
    errorResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type')
    return errorResponse
  }
}

