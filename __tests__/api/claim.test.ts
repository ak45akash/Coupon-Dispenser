/**
 * Tests for POST /api/claim
 * Tests atomic claim flow with unique constraint enforcement
 */

import { POST } from '@/app/api/claim/route'
import { NextRequest } from 'next/server'
import { extractWidgetSession } from '@/lib/jwt/widget-session'
import { atomicClaimCoupon } from '@/lib/db/coupons'

// Mock dependencies
jest.mock('@/lib/jwt/widget-session')
jest.mock('@/lib/db/coupons')

const mockExtractWidgetSession = extractWidgetSession as jest.MockedFunction<typeof extractWidgetSession>
const mockAtomicClaimCoupon = atomicClaimCoupon as jest.MockedFunction<typeof atomicClaimCoupon>

describe('POST /api/claim', () => {
  const mockUserId = 'user-123'
  const mockVendorId = 'vendor-456'
  const mockCouponId = 'coupon-789'
  const mockSession = {
    user_id: mockUserId,
    vendor_id: mockVendorId,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should successfully claim coupon', async () => {
    mockExtractWidgetSession.mockReturnValue(mockSession as any)
    mockAtomicClaimCoupon.mockResolvedValue({
      coupon_code: 'SUCCESS123',
    })

    const request = new NextRequest('http://localhost/api/claim', {
      method: 'POST',
      headers: {
        authorization: 'Bearer test-token',
      },
      body: JSON.stringify({
        coupon_id: mockCouponId,
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.coupon_code).toBe('SUCCESS123')
    expect(mockAtomicClaimCoupon).toHaveBeenCalledWith(mockUserId, mockCouponId)
  })

  it('should return 409 COUPON_ALREADY_CLAIMED when coupon already claimed this month', async () => {
    mockExtractWidgetSession.mockReturnValue(mockSession as any)
    const error = new Error('COUPON_ALREADY_CLAIMED')
    mockAtomicClaimCoupon.mockRejectedValue(error)

    const request = new NextRequest('http://localhost/api/claim', {
      method: 'POST',
      headers: {
        authorization: 'Bearer test-token',
      },
      body: JSON.stringify({
        coupon_id: mockCouponId,
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(409)
    expect(data.success).toBe(false)
    expect(data.error).toBe('COUPON_ALREADY_CLAIMED')
  })

  it('should return 409 USER_ALREADY_CLAIMED when user already claimed this month', async () => {
    mockExtractWidgetSession.mockReturnValue(mockSession as any)
    const error = new Error('USER_ALREADY_CLAIMED')
    mockAtomicClaimCoupon.mockRejectedValue(error)

    const request = new NextRequest('http://localhost/api/claim', {
      method: 'POST',
      headers: {
        authorization: 'Bearer test-token',
      },
      body: JSON.stringify({
        coupon_id: mockCouponId,
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(409)
    expect(data.success).toBe(false)
    expect(data.error).toBe('USER_ALREADY_CLAIMED')
  })

  it('should return 401 if no widget session token', async () => {
    mockExtractWidgetSession.mockReturnValue(null)

    const request = new NextRequest('http://localhost/api/claim', {
      method: 'POST',
      body: JSON.stringify({
        coupon_id: mockCouponId,
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.success).toBe(false)
    expect(data.error).toContain('Unauthorized')
  })

  it('should return 400 for invalid coupon_id format', async () => {
    mockExtractWidgetSession.mockReturnValue(mockSession as any)

    const request = new NextRequest('http://localhost/api/claim', {
      method: 'POST',
      headers: {
        authorization: 'Bearer test-token',
      },
      body: JSON.stringify({
        coupon_id: 'invalid-uuid',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toContain('Validation')
  })

  it('should return 404 if coupon not found', async () => {
    mockExtractWidgetSession.mockReturnValue(mockSession as any)
    const error = new Error('Coupon not found')
    mockAtomicClaimCoupon.mockRejectedValue(error)

    const request = new NextRequest('http://localhost/api/claim', {
      method: 'POST',
      headers: {
        authorization: 'Bearer test-token',
      },
      body: JSON.stringify({
        coupon_id: mockCouponId,
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Coupon not found')
  })
})

