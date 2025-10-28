import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { assignPartnerAccessSchema } from '@/lib/validators/user'
import {
  assignPartnerVendorAccess,
  getPartnerVendorAccess,
} from '@/lib/db/users'
import { canManageUsers } from '@/lib/auth/permissions'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !canManageUsers(session.user.role)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      )
    }

    const { id } = await params
    const vendorIds = await getPartnerVendorAccess(id)

    return NextResponse.json({ success: true, data: vendorIds })
  } catch (error) {
    console.error('Error fetching vendor access:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !canManageUsers(session.user.role)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const validatedData = assignPartnerAccessSchema.parse({
      ...body,
      user_id: id,
    })

    await assignPartnerVendorAccess(
      validatedData.user_id,
      validatedData.vendor_ids
    )

    return NextResponse.json({
      success: true,
      message: 'Vendor access updated successfully',
    })
  } catch (error: any) {
    console.error('Error updating vendor access:', error)

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

