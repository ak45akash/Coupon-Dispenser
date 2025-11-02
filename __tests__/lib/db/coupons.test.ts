/**
 * Tests for Shared Coupon Model
 * 
 * Tests verify that:
 * - Multiple users can claim the same coupon
 * - Monthly limits are enforced through claim_history
 * - Coupons are always available (no is_claimed field)
 */

import {
  claimCoupon,
  checkMonthlyClaimLimit,
  getAvailableCouponsByVendor,
} from '@/lib/db/coupons'
import { supabaseAdmin } from '@/lib/supabase/server'

// Mock Supabase
jest.mock('@/lib/supabase/server', () => ({
  supabaseAdmin: {
    from: jest.fn(),
  },
}))

const mockSupabase = supabaseAdmin as jest.Mocked<typeof supabaseAdmin>

describe('Shared Coupon Model', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('claimCoupon', () => {
    it('should allow multiple users to claim the same coupon', async () => {
      const userId1 = 'user-1-id'
      const userId2 = 'user-2-id'
      const vendorId = 'vendor-1-id'
      const couponId = 'coupon-1-id'

      const mockCoupon = {
        id: couponId,
        vendor_id: vendorId,
        code: 'SHARED20',
        description: 'Shared coupon',
        discount_value: '20% off',
        expiry_date: null,
        created_by: 'admin-id',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        deleted_at: null,
        deleted_by: null,
      }

      // Mock system config (monthly limit enabled)
      const mockConfigQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            value: { enabled: true, max_claims_per_vendor: 1 },
          },
        }),
      }

      // Mock claim_history check (no existing claims)
      const mockHistoryCheckQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      }

      // Mock coupon fetch (returns same coupon for both users)
      const mockCouponQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        is: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockCoupon,
          error: null,
        }),
      }

      // Mock claim_history insert
      const mockInsertQuery = {
        insert: jest.fn().mockResolvedValue({
          error: null,
        }),
      }

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'system_config') return mockConfigQuery as any
        if (table === 'claim_history') {
          // First call is check, second is insert
          const callCount = mockSupabase.from.mock.calls.filter(
            (call) => call[0] === 'claim_history'
          ).length
          if (callCount === 1) return mockHistoryCheckQuery as any
          return mockInsertQuery as any
        }
        if (table === 'coupons') return mockCouponQuery as any
        return {} as any
      })

      // User 1 claims the coupon
      const result1 = await claimCoupon(userId1, vendorId)
      expect(result1).toEqual(mockCoupon)
      expect(mockInsertQuery.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: userId1,
          vendor_id: vendorId,
          coupon_id: couponId,
        })
      )

      // User 2 claims the same coupon (should work)
      // Reset mock call count for claim_history
      mockSupabase.from.mockClear()
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'system_config') return mockConfigQuery as any
        if (table === 'claim_history') {
          // Check returns empty (new month or different logic path)
          const mockHistoryCheckQuery2 = {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            gte: jest.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }
          const mockInsertQuery2 = {
            insert: jest.fn().mockResolvedValue({
              error: null,
            }),
          }
          const callCount = mockSupabase.from.mock.calls.filter(
            (call) => call[0] === 'claim_history'
          ).length
          if (callCount === 1) return mockHistoryCheckQuery2 as any
          return mockInsertQuery2 as any
        }
        if (table === 'coupons') return mockCouponQuery as any
        return {} as any
      })

      const result2 = await claimCoupon(userId2, vendorId)
      expect(result2).toEqual(mockCoupon) // Same coupon returned
    })

    it('should enforce monthly claim limit', async () => {
      const userId = 'user-1-id'
      const vendorId = 'vendor-1-id'

      // Mock system config with limit of 1 per month
      const mockConfigQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            value: { enabled: true, max_claims_per_vendor: 1 },
          },
        }),
      }

      // Mock claim_history showing user already claimed this month
      const mockHistoryQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockResolvedValue({
          data: [{ id: 'existing-claim' }], // User already has 1 claim
          error: null,
        }),
      }

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'system_config') return mockConfigQuery as any
        if (table === 'claim_history') return mockHistoryQuery as any
        return {} as any
      })

      await expect(claimCoupon(userId, vendorId)).rejects.toThrow(
        'Monthly claim limit reached for this vendor'
      )
    })

    it('should return original coupon unchanged (shared model)', async () => {
      const userId = 'user-1-id'
      const vendorId = 'vendor-1-id'
      const couponId = 'coupon-1-id'

      const mockCoupon = {
        id: couponId,
        vendor_id: vendorId,
        code: 'SHARED20',
        created_by: 'admin-id',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        deleted_at: null,
        deleted_by: null,
      }

      const mockConfigQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { value: { enabled: false } },
        }),
      }

      const mockHistoryCheckQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockResolvedValue({ data: [], error: null }),
      }

      const mockCouponQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        is: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockCoupon,
          error: null,
        }),
      }

      // Mock both claim_history queries - limit check and insert
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'system_config') return mockConfigQuery as any
        if (table === 'claim_history') {
          // Return an object that can handle both query builder and insert
          // This simulates Supabase's fluent API
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            gte: jest.fn().mockResolvedValue({ data: [], error: null }),
            insert: jest.fn().mockResolvedValue({ error: null }),
          } as any
        }
        if (table === 'coupons') return mockCouponQuery as any
        return {} as any
      })

      const result = await claimCoupon(userId, vendorId)

      // Key assertion: coupon returned unchanged (shared model)
      // In the shared model, coupons are never updated when claimed
      expect(result).toEqual(mockCoupon)
      expect(mockCouponQuery.single).toHaveBeenCalled()
    })
  })

  describe('getAvailableCouponsByVendor', () => {
    it('should return all coupons (no is_claimed filter)', async () => {
      const vendorId = 'vendor-1-id'

      const mockCoupons = [
        {
          id: 'coupon-1',
          vendor_id: vendorId,
          code: 'COUPON1',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          deleted_at: null,
          deleted_by: null,
        },
        {
          id: 'coupon-2',
          vendor_id: vendorId,
          code: 'COUPON2',
          created_at: '2024-01-02T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
          deleted_at: null,
          deleted_by: null,
        },
      ]

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        is: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: mockCoupons,
          error: null,
        }),
      }

      mockSupabase.from.mockReturnValue(mockQuery as any)

      const result = await getAvailableCouponsByVendor(vendorId)

      expect(result).toEqual(mockCoupons)
      expect(mockQuery.eq).toHaveBeenCalledWith('vendor_id', vendorId)
      expect(mockQuery.is).toHaveBeenCalledWith('deleted_at', null)
      // Should NOT have eq('is_claimed', false) call
      expect(mockQuery.eq).not.toHaveBeenCalledWith('is_claimed', false)
    })
  })

  describe('checkMonthlyClaimLimit', () => {
    it('should allow claims when limit not reached', async () => {
      const userId = 'user-1-id'
      const vendorId = 'vendor-1-id'

      const mockConfigQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            value: { enabled: true, max_claims_per_vendor: 1 },
          },
        }),
      }

      const mockHistoryQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockResolvedValue({
          data: [], // No claims this month
          error: null,
        }),
      }

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'system_config') return mockConfigQuery as any
        if (table === 'claim_history') return mockHistoryQuery as any
        return {} as any
      })

      const result = await checkMonthlyClaimLimit(userId, vendorId)
      expect(result).toBe(true)
    })

    it('should block claims when limit reached', async () => {
      const userId = 'user-1-id'
      const vendorId = 'vendor-1-id'

      const mockConfigQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            value: { enabled: true, max_claims_per_vendor: 1 },
          },
        }),
      }

      const mockHistoryQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockResolvedValue({
          data: [{ id: 'claim-1' }], // Already has 1 claim (limit)
          error: null,
        }),
      }

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'system_config') return mockConfigQuery as any
        if (table === 'claim_history') return mockHistoryQuery as any
        return {} as any
      })

      const result = await checkMonthlyClaimLimit(userId, vendorId)
      expect(result).toBe(false)
    })

    it('should allow unlimited claims when limit disabled', async () => {
      const userId = 'user-1-id'
      const vendorId = 'vendor-1-id'

      const mockConfigQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            value: { enabled: false, max_claims_per_vendor: 1 },
          },
        }),
      }

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'system_config') return mockConfigQuery as any
        return {} as any
      })

      const result = await checkMonthlyClaimLimit(userId, vendorId)
      expect(result).toBe(true)
      // Should not query claim_history when limit is disabled
    })
  })
})

