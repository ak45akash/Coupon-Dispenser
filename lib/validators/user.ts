import { z } from 'zod'

export const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(1, 'Name is required'),
  role: z.enum(['super_admin', 'partner_admin', 'user']),
})

export const updateUserRoleSchema = z.object({
  role: z.enum(['super_admin', 'partner_admin', 'user']),
})

export const assignPartnerAccessSchema = z.object({
  user_id: z.string().uuid('Invalid user ID'),
  vendor_ids: z.array(z.string().uuid('Invalid vendor ID')),
})

export type CreateUserInput = z.infer<typeof createUserSchema>
export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>
export type AssignPartnerAccessInput = z.infer<typeof assignPartnerAccessSchema>

