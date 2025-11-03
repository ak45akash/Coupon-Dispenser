import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createVendorSchema } from '@/lib/validators/vendor'
import { getAllVendors, createVendor, getVendorsWithStats } from '@/lib/db/vendors'
import { assignPartnerVendorAccess } from '@/lib/db/users'
import { canManageVendors, isPartnerAdmin } from '@/lib/auth/permissions'

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
    const withStats = searchParams.get('stats') === 'true'

    const vendors = withStats ? await getVendorsWithStats() : await getAllVendors()

    return NextResponse.json({ success: true, data: vendors })
  } catch (error) {
    console.error('Error fetching vendors:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !canManageVendors(session.user.role)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = createVendorSchema.parse(body)

    const vendor = await createVendor(validatedData, session.user.id)

    // If partner admin created the vendor, auto-assign them access to it
    if (isPartnerAdmin(session.user.role)) {
      await assignPartnerVendorAccess(session.user.id, [vendor.id])
    }

    return NextResponse.json(
      { success: true, data: vendor, message: 'Vendor created successfully' },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Error creating vendor:', error)
    
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

