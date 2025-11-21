import { z } from 'zod'

export const createCouponSchema = z.object({
  vendor_id: z.string().uuid('Invalid vendor ID'),
  code: z.string().min(1, 'Code is required').max(100),
  description: z.string().min(1, 'Description is required').max(500),
  discount_value: z.string().max(100).optional(),
  expiry_date: z.string().datetime('Invalid expiry date format').optional(),
})

export const bulkCreateCouponsSchema = z.object({
  vendor_id: z.string().uuid('Invalid vendor ID'),
  coupons: z.array(
    z.object({
      code: z.string().min(1, 'Code is required').max(100),
      description: z.string().min(1, 'Description is required').max(500),
      discount_value: z.string().max(100).optional(),
      expiry_date: z.string().datetime('Invalid expiry date format').optional(),
    })
  ).min(1, 'At least one coupon is required'),
})

export const claimCouponSchema = z.object({
  coupon_id: z.string().uuid('Invalid coupon ID'),
  user_email: z.string().email('Invalid email').optional(),
  user_id: z.string().uuid('Invalid user ID').optional(),
})

export type CreateCouponInput = z.infer<typeof createCouponSchema>
export type BulkCreateCouponsInput = z.infer<typeof bulkCreateCouponsSchema>
export type ClaimCouponInput = z.infer<typeof claimCouponSchema>

