import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { permanentlyDeleteAll } from '@/lib/db/trash'

/**
 * POST /api/trash/delete-all
 * Permanently delete all items from trash
 */
export async function POST() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only super_admin can delete all trash
    if (session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden: Super Admin access required' }, { status: 403 })
    }

    const result = await permanentlyDeleteAll()

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error deleting all trash items:', error)

    return NextResponse.json({ error: error.message || 'Failed to delete all items' }, { status: 500 })
  }
}

