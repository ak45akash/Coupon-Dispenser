import { supabaseAdmin } from '@/lib/supabase/server'
import type { User, UserRole } from '@/types/database'
import type { CreateUserInput } from '@/lib/validators/user'
import { sendWelcomeEmail } from '@/lib/email/send'

export async function createUser(input: CreateUserInput, createdByUserId?: string): Promise<User> {
  // First, create the user in Supabase Auth with default password
  const defaultPassword = 'password'
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: input.email,
    password: defaultPassword,
    email_confirm: true, // Auto-confirm email for admin-created users
  })

  if (authError) {
    throw new Error(authError.message || 'Failed to create auth user')
  }

  if (!authData.user) {
    throw new Error('Failed to create auth user')
  }

  // Then, create the user in the public.users table
  const { data: userData, error: userError } = await supabaseAdmin
    .from('users')
    .insert({
      id: authData.user.id,
      email: input.email,
      name: input.name,
      role: input.role,
    })
    .select()
    .single()

  if (userError) {
    // If user table insert fails, try to delete the auth user
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
    throw new Error(userError.message || 'Failed to create user record')
  }

  // Get the admin's name who is creating this user
  let invitedByName = 'Administrator'
  if (createdByUserId) {
    const creator = await getUserById(createdByUserId)
    if (creator) {
      invitedByName = creator.name || creator.email
    }
  }

  // Send welcome email to the new user
  try {
    await sendWelcomeEmail(input.email, input.name, invitedByName)
  } catch (emailError) {
    console.error('Error sending welcome email:', emailError)
    // Continue - user is created successfully
  }

  return userData
}

export async function getAllUsers(): Promise<User[]> {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .is('deleted_at', null) // Exclude soft-deleted users
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function getUserById(id: string): Promise<User | null> {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null) // Exclude soft-deleted users
    .single()

  if (error) return null
  return data
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('email', email)
    .is('deleted_at', null) // Exclude soft-deleted users
    .single()

  if (error) return null
  return data
}

export async function updateUserRole(
  userId: string,
  role: UserRole
): Promise<User> {
  const { data, error } = await supabaseAdmin
    .from('users')
    .update({ role })
    .eq('id', userId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function assignPartnerVendorAccess(
  userId: string,
  vendorIds: string[]
): Promise<void> {
  // Remove existing access
  await supabaseAdmin
    .from('partner_vendor_access')
    .delete()
    .eq('user_id', userId)

  // Add new access
  if (vendorIds.length > 0) {
    const accessRecords = vendorIds.map((vendorId) => ({
      user_id: userId,
      vendor_id: vendorId,
    }))

    const { error } = await supabaseAdmin
      .from('partner_vendor_access')
      .insert(accessRecords)

    if (error) throw error
  }
}

export async function getPartnerVendorAccess(
  userId: string
): Promise<string[]> {
  const { data, error } = await supabaseAdmin
    .from('partner_vendor_access')
    .select('vendor_id')
    .eq('user_id', userId)

  if (error) throw error
  return data?.map((item) => item.vendor_id) || []
}

