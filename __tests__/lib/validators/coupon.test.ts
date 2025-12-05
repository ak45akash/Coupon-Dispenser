import {
  createCouponSchema,
  bulkCreateCouponsSchema,
  claimCouponSchema,
} from '@/lib/validators/coupon'

describe('Coupon Validators', () => {
  describe('createCouponSchema', () => {
    it('should validate a valid coupon', () => {
      const validCoupon = {
        vendor_id: '123e4567-e89b-12d3-a456-426614174000',
        code: 'SAVE20',
        description: 'Get 20% off',
        discount_value: '20% off',
        expiry_date: '2024-12-31T23:59:59Z',
      }

      expect(() => createCouponSchema.parse(validCoupon)).not.toThrow()
    })

    it('should require vendor_id and code', () => {
      const invalidCoupon = {
        description: 'Get 20% off',
      }

      expect(() => createCouponSchema.parse(invalidCoupon)).toThrow()
    })

    it('should validate UUID format for vendor_id', () => {
      const invalidCoupon = {
        vendor_id: 'not-a-uuid',
        code: 'SAVE20',
      }

      expect(() => createCouponSchema.parse(invalidCoupon)).toThrow()
    })

    it('should allow optional fields (description, discount_value, expiry_date)', () => {
      const couponWithoutOptionalFields = {
        vendor_id: '123e4567-e89b-12d3-a456-426614174000',
        code: 'SAVE20',
      }

      expect(() => createCouponSchema.parse(couponWithoutOptionalFields)).not.toThrow()
    })

    it('should allow empty string for optional fields', () => {
      const couponWithEmptyOptionalFields = {
        vendor_id: '123e4567-e89b-12d3-a456-426614174000',
        code: 'SAVE20',
        description: '',
        discount_value: '',
      }

      // Empty strings should be converted to undefined by API route
      expect(() => createCouponSchema.parse(couponWithEmptyOptionalFields)).not.toThrow()
    })
  })

  describe('bulkCreateCouponsSchema', () => {
    it('should validate bulk coupon creation with all required fields', () => {
      const bulkData = {
        vendor_id: '123e4567-e89b-12d3-a456-426614174000',
        coupons: [
          { 
            code: 'SAVE10', 
            description: '10% off',
            discount_value: '10%',
            expiry_date: '2024-12-31T23:59:59Z',
          },
          { 
            code: 'SAVE20', 
            description: '20% off',
            discount_value: '20%',
            expiry_date: '2024-12-31T23:59:59Z',
          },
        ],
      }

      expect(() => bulkCreateCouponsSchema.parse(bulkData)).not.toThrow()
    })

    it('should require at least one coupon', () => {
      const invalidData = {
        vendor_id: '123e4567-e89b-12d3-a456-426614174000',
        coupons: [],
      }

      expect(() => bulkCreateCouponsSchema.parse(invalidData)).toThrow()
    })
  })

  describe('claimCouponSchema', () => {
    it('should validate claim request with coupon_id and user_email', () => {
      const claimRequest = {
        coupon_id: '123e4567-e89b-12d3-a456-426614174000',
        user_email: 'user@example.com',
      }

      expect(() => claimCouponSchema.parse(claimRequest)).not.toThrow()
    })

    it('should validate claim request with coupon_id and user_id', () => {
      const claimRequest = {
        coupon_id: '123e4567-e89b-12d3-a456-426614174000',
        user_id: '123e4567-e89b-12d3-a456-426614174001',
      }

      expect(() => claimCouponSchema.parse(claimRequest)).not.toThrow()
    })

    it('should validate email format', () => {
      const invalidRequest = {
        coupon_id: '123e4567-e89b-12d3-a456-426614174000',
        user_email: 'invalid-email',
      }

      expect(() => claimCouponSchema.parse(invalidRequest)).toThrow()
    })

    it('should require coupon_id', () => {
      const request = {
        user_email: 'user@example.com',
      }

      expect(() => claimCouponSchema.parse(request)).toThrow()
    })

    it('should allow claim with only coupon_id (user identification optional)', () => {
      const request = {
        coupon_id: '123e4567-e89b-12d3-a456-426614174000',
      }

      expect(() => claimCouponSchema.parse(request)).not.toThrow()
    })
  })
})

