import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getVendorByPartner } from '@/lib/db/vendors'
import { isPartnerAdmin } from '@/lib/auth/permissions'

/**
 * GET /api/vendors/my-vendor
 * Get the vendor associated with the current partner admin user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only partner admins have associated vendors
    if (!isPartnerAdmin(session.user.role)) {
      return NextResponse.json(
        { success: false, error: 'Only partner admins can access this endpoint' },
        { status: 403 }
      )
    }

    const vendor = await getVendorByPartner(session.user.id)

    if (!vendor) {
      return NextResponse.json(
        { success: false, error: 'No vendor associated with this account' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: vendor })
  } catch (error) {
    console.error('Error fetching vendor:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

