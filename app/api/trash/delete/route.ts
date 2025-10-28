import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { permanentlyDeleteUser, permanentlyDeleteVendor, permanentlyDeleteCoupon } from '@/lib/db/trash'
import { z } from 'zod'

const deleteSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(['user', 'vendor', 'coupon']),
})

/**
 * DELETE /api/trash/delete
 * Permanently delete an item from trash
 */
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only super_admin can permanently delete
    if (session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden: Super Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = deleteSchema.parse(body)

    let result

    switch (validatedData.type) {
      case 'user':
        result = await permanentlyDeleteUser(validatedData.id)
        break
      case 'vendor':
        result = await permanentlyDeleteVendor(validatedData.id)
        break
      case 'coupon':
        result = await permanentlyDeleteCoupon(validatedData.id)
        break
      default:
        return NextResponse.json({ error: 'Invalid item type' }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: `${validatedData.type} permanently deleted`,
      ...result,
    })
  } catch (error: any) {
    console.error('Error permanently deleting item:', error)

    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 })
    }

    return NextResponse.json({ error: error.message || 'Failed to permanently delete item' }, { status: 500 })
  }
}

