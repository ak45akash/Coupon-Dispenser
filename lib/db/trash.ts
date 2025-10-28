import { supabaseAdmin } from '@/lib/supabase/server'
import { TrashItem, TrashItemType } from '@/types/database'

/**
 * Soft delete a user
 */
export async function softDeleteUser(userId: string, deletedBy: string) {
  const { data, error } = await supabaseAdmin
    .from('users')
    .update({
      deleted_at: new Date().toISOString(),
      deleted_by: deletedBy,
    })
    .eq('id', userId)
    .is('deleted_at', null) // Only delete if not already deleted
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Soft delete a vendor
 */
export async function softDeleteVendor(vendorId: string, deletedBy: string) {
  const { data, error } = await supabaseAdmin
    .from('vendors')
    .update({
      deleted_at: new Date().toISOString(),
      deleted_by: deletedBy,
    })
    .eq('id', vendorId)
    .is('deleted_at', null)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Soft delete a coupon
 */
export async function softDeleteCoupon(couponId: string, deletedBy: string) {
  const { data, error } = await supabaseAdmin
    .from('coupons')
    .update({
      deleted_at: new Date().toISOString(),
      deleted_by: deletedBy,
    })
    .eq('id', couponId)
    .is('deleted_at', null)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Get all items in trash
 */
export async function getTrashItems(): Promise<TrashItem[]> {
  const { data, error } = await supabaseAdmin.from('trash_summary').select('*').order('deleted_at', { ascending: false })

  if (error) throw error
  return data as TrashItem[]
}

/**
 * Get trash items by type
 */
export async function getTrashItemsByType(itemType: TrashItemType): Promise<TrashItem[]> {
  const { data, error } = await supabaseAdmin
    .from('trash_summary')
    .select('*')
    .eq('item_type', itemType)
    .order('deleted_at', { ascending: false })

  if (error) throw error
  return data as TrashItem[]
}

/**
 * Restore a user from trash
 */
export async function restoreUser(userId: string) {
  const { data, error } = await supabaseAdmin
    .from('users')
    .update({
      deleted_at: null,
      deleted_by: null,
    })
    .eq('id', userId)
    .not('deleted_at', 'is', null) // Only restore if it's deleted
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Restore a vendor from trash
 */
export async function restoreVendor(vendorId: string) {
  const { data, error } = await supabaseAdmin
    .from('vendors')
    .update({
      deleted_at: null,
      deleted_by: null,
    })
    .eq('id', vendorId)
    .not('deleted_at', 'is', null)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Restore a coupon from trash
 */
export async function restoreCoupon(couponId: string) {
  const { data, error } = await supabaseAdmin
    .from('coupons')
    .update({
      deleted_at: null,
      deleted_by: null,
    })
    .eq('id', couponId)
    .not('deleted_at', 'is', null)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Permanently delete a user (hard delete)
 */
export async function permanentlyDeleteUser(userId: string) {
  // First check if the user is in trash
  const { data: user, error: fetchError } = await supabaseAdmin
    .from('users')
    .select('id, deleted_at')
    .eq('id', userId)
    .not('deleted_at', 'is', null)
    .single()

  if (fetchError) throw fetchError
  if (!user) throw new Error('User not found in trash')

  // Permanently delete
  const { error } = await supabaseAdmin.from('users').delete().eq('id', userId)

  if (error) throw error
  return { success: true, message: 'User permanently deleted' }
}

/**
 * Permanently delete a vendor (hard delete)
 */
export async function permanentlyDeleteVendor(vendorId: string) {
  const { data: vendor, error: fetchError } = await supabaseAdmin
    .from('vendors')
    .select('id, deleted_at')
    .eq('id', vendorId)
    .not('deleted_at', 'is', null)
    .single()

  if (fetchError) throw fetchError
  if (!vendor) throw new Error('Vendor not found in trash')

  const { error } = await supabaseAdmin.from('vendors').delete().eq('id', vendorId)

  if (error) throw error
  return { success: true, message: 'Vendor permanently deleted' }
}

/**
 * Permanently delete a coupon (hard delete)
 */
export async function permanentlyDeleteCoupon(couponId: string) {
  const { data: coupon, error: fetchError } = await supabaseAdmin
    .from('coupons')
    .select('id, deleted_at')
    .eq('id', couponId)
    .not('deleted_at', 'is', null)
    .single()

  if (fetchError) throw fetchError
  if (!coupon) throw new Error('Coupon not found in trash')

  const { error } = await supabaseAdmin.from('coupons').delete().eq('id', couponId)

  if (error) throw error
  return { success: true, message: 'Coupon permanently deleted' }
}

/**
 * Get trash statistics
 */
export async function getTrashStats() {
  const { data, error } = await supabaseAdmin.from('trash_summary').select('item_type')

  if (error) throw error

  const stats = {
    total: data.length,
    users: data.filter((item) => item.item_type === 'user').length,
    vendors: data.filter((item) => item.item_type === 'vendor').length,
    coupons: data.filter((item) => item.item_type === 'coupon').length,
  }

  return stats
}

