import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import {
  getAnalyticsOverview,
  getVendorAnalytics,
  getClaimTrends,
  getTopVendors,
} from '@/lib/db/analytics'
import { canViewAnalytics } from '@/lib/auth/permissions'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !canViewAnalytics(session.user.role)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type')

    switch (type) {
      case 'overview':
        const overview = await getAnalyticsOverview()
        return NextResponse.json({ success: true, data: overview })

      case 'vendors': {
        const vendorId = searchParams.get('vendor_id')
        const vendorAnalytics = await getVendorAnalytics(
          vendorId || undefined
        )
        return NextResponse.json({ success: true, data: vendorAnalytics })
      }

      case 'trends': {
        const days = parseInt(searchParams.get('days') || '30')
        const trends = await getClaimTrends(days)
        return NextResponse.json({ success: true, data: trends })
      }

      case 'top-vendors': {
        const limit = parseInt(searchParams.get('limit') || '10')
        const topVendors = await getTopVendors(limit)
        return NextResponse.json({ success: true, data: topVendors })
      }

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid analytics type' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

