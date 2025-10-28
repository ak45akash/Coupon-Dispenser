import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { restoreUser, restoreVendor, restoreCoupon } from '@/lib/db/trash'
import { z } from 'zod'

const restoreSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(['user', 'vendor', 'coupon']),
})

/**
 * POST /api/trash/restore
 * Restore an item from trash
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only super_admin can restore from trash
    if (session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden: Super Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = restoreSchema.parse(body)

    let restoredItem

    switch (validatedData.type) {
      case 'user':
        restoredItem = await restoreUser(validatedData.id)
        break
      case 'vendor':
        restoredItem = await restoreVendor(validatedData.id)
        break
      case 'coupon':
        restoredItem = await restoreCoupon(validatedData.id)
        break
      default:
        return NextResponse.json({ error: 'Invalid item type' }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: `${validatedData.type} restored successfully`,
      data: restoredItem,
    })
  } catch (error: any) {
    console.error('Error restoring item:', error)

    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 })
    }

    return NextResponse.json({ error: error.message || 'Failed to restore item' }, { status: 500 })
  }
}

