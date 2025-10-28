import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { updateUserRoleSchema } from '@/lib/validators/user'
import { updateUserRole } from '@/lib/db/users'
import { canManageUsers } from '@/lib/auth/permissions'

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
    const validatedData = updateUserRoleSchema.parse(body)

    const user = await updateUserRole(id, validatedData.role)

    return NextResponse.json({
      success: true,
      data: user,
      message: 'User role updated successfully',
    })
  } catch (error: any) {
    console.error('Error updating user role:', error)

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

