import { z } from 'zod'

export const createCouponSchema = z.object({
  vendor_id: z.string().uuid('Invalid vendor ID'),
  code: z.string().min(1, 'Code is required').max(100),
  description: z.string().max(500).optional(),
  discount_value: z.string().max(100).optional(),
  expiry_date: z.string().datetime().optional().or(z.literal('')),
})

export const bulkCreateCouponsSchema = z.object({
  vendor_id: z.string().uuid('Invalid vendor ID'),
  coupons: z.array(
    z.object({
      code: z.string().min(1).max(100),
      description: z.string().max(500).optional(),
      discount_value: z.string().max(100).optional(),
      expiry_date: z.string().datetime().optional().or(z.literal('')),
    })
  ).min(1, 'At least one coupon is required'),
})

export const claimCouponSchema = z.object({
  vendor_id: z.string().uuid('Invalid vendor ID'),
  user_email: z.string().email('Invalid email').optional(),
})

export type CreateCouponInput = z.infer<typeof createCouponSchema>
export type BulkCreateCouponsInput = z.infer<typeof bulkCreateCouponsSchema>
export type ClaimCouponInput = z.infer<typeof claimCouponSchema>

