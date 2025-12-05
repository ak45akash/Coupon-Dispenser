/**
 * Tests for GET /api/available-coupons
 * Tests eligibility filtering and monthly claim limits
 */

import { GET } from '@/app/api/available-coupons/route'
import { NextRequest } from 'next/server'
import { extractWidgetSession } from '@/lib/jwt/widget-session'
import { getCouponsByVendor } from '@/lib/db/coupons'
import { supabaseAdmin } from '@/lib/supabase/server'

// Mock dependencies
jest.mock('@/lib/jwt/widget-session')
jest.mock('@/lib/db/coupons')
jest.mock('@/lib/supabase/server', () => ({
  supabaseAdmin: {
    from: jest.fn(),
  },
}))

const mockExtractWidgetSession = extractWidgetSession as jest.MockedFunction<typeof extractWidgetSession>
const mockGetCouponsByVendor = getCouponsByVendor as jest.MockedFunction<typeof getCouponsByVendor>
const mockSupabaseFrom = supabaseAdmin.from as jest.MockedFunction<typeof supabaseAdmin.from>

describe('GET /api/available-coupons', () => {
  const mockUserId = 'user-123'
  const mockVendorId = 'vendor-456'
  const mockSession = {
    user_id: mockUserId,
    vendor_id: mockVendorId,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return available coupons for authenticated user', async () => {
    mockExtractWidgetSession.mockReturnValue(mockSession as any)
    mockGetCouponsByVendor.mockResolvedValue([
      {
        id: 'coupon-1',
        vendor_id: mockVendorId,
        code: 'CODE1',
        description: 'Test Coupon 1',
        discount_value: '10% Off',
        deleted_at: null,
      },
      {
        id: 'coupon-2',
        vendor_id: mockVendorId,
        code: 'CODE2',
        description: 'Test Coupon 2',
        discount_value: '20% Off',
        deleted_at: null,
      },
    ] as any)

    // Mock claim_history query (no existing claims)
    const mockSelect = jest.fn().mockReturnThis()
    const mockEq = jest.fn().mockReturnThis()
    const mockLimit = jest.fn().mockReturnThis()
    const mockMaybeSingle = jest.fn().mockResolvedValue({ data: null, error: null })
    
    mockSupabaseFrom.mockReturnValue({
      select: mockSelect,
      eq: mockEq,
      limit: mockLimit,
      maybeSingle: mockMaybeSingle,
    } as any)

    // Mock claimed coupons query
    const mockSelect2 = jest.fn().mockReturnThis()
    const mockEq2 = jest.fn().mockReturnThis()
    const mockSelectResult = jest.fn().mockResolvedValue({
      data: [],
      error: null,
    })
    
    mockSupabaseFrom.mockReturnValueOnce({
      select: mockSelect,
      eq: mockEq,
      limit: mockLimit,
      maybeSingle: mockMaybeSingle,
    } as any).mockReturnValueOnce({
      select: mockSelect2,
      eq: mockEq2,
    } as any)

    // Fix the second call to return empty array
    mockSelect2.mockReturnValue({
      data: [],
      error: null,
    })

    const request = new NextRequest(`http://localhost/api/available-coupons?vendor=${mockVendorId}`, {
      method: 'GET',
      headers: {
        authorization: 'Bearer test-token',
      },
    })

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.coupons).toHaveLength(2)
    expect(data.data.user_already_claimed).toBe(false)
  })

  it('should return empty list if user already claimed this month', async () => {
    mockExtractWidgetSession.mockReturnValue(mockSession as any)
    mockGetCouponsByVendor.mockResolvedValue([
      {
        id: 'coupon-1',
        vendor_id: mockVendorId,
        code: 'CODE1',
        description: 'Test Coupon 1',
        deleted_at: null,
      },
    ] as any)

    // Mock existing claim
    const mockSelect = jest.fn().mockReturnThis()
    const mockEq = jest.fn().mockReturnThis()
    const mockLimit = jest.fn().mockReturnThis()
    const mockMaybeSingle = jest.fn().mockResolvedValue({
      data: {
        coupon_id: 'coupon-1',
        claimed_at: new Date().toISOString(),
      },
      error: null,
    })
    
    mockSupabaseFrom.mockReturnValue({
      select: mockSelect,
      eq: mockEq,
      limit: mockLimit,
      maybeSingle: mockMaybeSingle,
    } as any)

    const request = new NextRequest(`http://localhost/api/available-coupons?vendor=${mockVendorId}`, {
      method: 'GET',
      headers: {
        authorization: 'Bearer test-token',
      },
    })

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.coupons).toHaveLength(0)
    expect(data.data.user_already_claimed).toBe(true)
  })

  it('should filter out coupons already claimed this month', async () => {
    mockExtractWidgetSession.mockReturnValue(mockSession as any)
    mockGetCouponsByVendor.mockResolvedValue([
      {
        id: 'coupon-1',
        vendor_id: mockVendorId,
        code: 'CODE1',
        description: 'Test Coupon 1',
        deleted_at: null,
      },
      {
        id: 'coupon-2',
        vendor_id: mockVendorId,
        code: 'CODE2',
        description: 'Test Coupon 2',
        deleted_at: null,
      },
    ] as any)

    // Mock no existing claim for user
    const mockSelect = jest.fn().mockReturnThis()
    const mockEq = jest.fn().mockReturnThis()
    const mockLimit = jest.fn().mockReturnThis()
    const mockMaybeSingle = jest.fn().mockResolvedValue({
      data: null,
      error: null,
    })
    
    // Mock claimed coupons (coupon-1 is claimed)
    const mockSelect2 = jest.fn().mockResolvedValue({
      data: [{ coupon_id: 'coupon-1' }],
      error: null,
    })
    
    mockSupabaseFrom.mockReturnValueOnce({
      select: mockSelect,
      eq: mockEq,
      limit: mockLimit,
      maybeSingle: mockMaybeSingle,
    } as any).mockReturnValueOnce({
      select: mockSelect2,
    } as any)

    const request = new NextRequest(`http://localhost/api/available-coupons?vendor=${mockVendorId}`, {
      method: 'GET',
      headers: {
        authorization: 'Bearer test-token',
      },
    })

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    // Should only return coupon-2 (coupon-1 is already claimed)
    expect(data.data.coupons).toHaveLength(1)
    expect(data.data.coupons[0].id).toBe('coupon-2')
  })

  it('should return 401 if no widget session token', async () => {
    mockExtractWidgetSession.mockReturnValue(null)

    const request = new NextRequest(`http://localhost/api/available-coupons?vendor=${mockVendorId}`, {
      method: 'GET',
    })

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.success).toBe(false)
    expect(data.error).toContain('Unauthorized')
  })

  it('should return 403 if vendor_id mismatch', async () => {
    mockExtractWidgetSession.mockReturnValue({
      user_id: mockUserId,
      vendor_id: 'different-vendor',
    } as any)

    const request = new NextRequest(`http://localhost/api/available-coupons?vendor=${mockVendorId}`, {
      method: 'GET',
      headers: {
        authorization: 'Bearer test-token',
      },
    })

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.success).toBe(false)
    expect(data.error).toContain('mismatch')
  })
})

