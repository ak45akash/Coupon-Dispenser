import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { softDeleteUser } from '@/lib/db/trash'

/**
 * DELETE /api/users/[id]
 * Soft delete a user (Super Admin only)
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only super_admin can delete users
    if (session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden: Super Admin access required' }, { status: 403 })
    }

    // Don't allow deleting yourself
    if (session.user.id === id) {
      return NextResponse.json({ error: 'You cannot delete yourself' }, { status: 400 })
    }

    // Soft delete the user
    await softDeleteUser(id, session.user.id)

    return NextResponse.json({
      success: true,
      message: 'User moved to trash',
    })
  } catch (error: any) {
    console.error('Error deleting user:', error)

    if (error.message?.includes('not found')) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }

    return NextResponse.json({ error: error.message || 'Failed to delete user' }, { status: 500 })
  }
}

