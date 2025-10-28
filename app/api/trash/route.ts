import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getTrashItems, getTrashStats } from '@/lib/db/trash'

/**
 * GET /api/trash
 * Get all items in trash or trash statistics
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only super_admin can view trash
    if (session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden: Super Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const statsOnly = searchParams.get('stats') === 'true'

    if (statsOnly) {
      const stats = await getTrashStats()
      return NextResponse.json(stats)
    }

    const items = await getTrashItems()
    return NextResponse.json(items)
  } catch (error: any) {
    console.error('Error fetching trash:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch trash items' }, { status: 500 })
  }
}

