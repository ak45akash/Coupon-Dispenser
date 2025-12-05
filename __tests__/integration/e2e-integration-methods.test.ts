/**
 * End-to-End Integration Tests
 * Tests all three integration methods: WordPress Plugin (API Key), API Key Method, JWT Method
 */

import { POST as widgetSessionPOST } from '@/app/api/widget-session/route'
import { POST as sessionFromTokenPOST } from '@/app/api/session-from-token/route'
import { GET as availableCouponsGET } from '@/app/api/available-coupons/route'
import { POST as claimPOST } from '@/app/api/claim/route'
import { NextRequest } from 'next/server'
import { signWidgetSession } from '@/lib/jwt/widget-session'
import jwt from 'jsonwebtoken'

// Mock database and Redis functions
jest.mock('@/lib/db/vendors')
jest.mock('@/lib/db/users')
jest.mock('@/lib/db/coupons')
jest.mock('@/lib/redis/client')
jest.mock('@/lib/supabase/server')

describe('End-to-End Integration Methods', () => {
  const mockVendorId = '550e8400-e29b-41d4-a716-446655440000'
  const mockApiKey = 'cdk_test_api_key_123456789'
  const mockPartnerSecret = 'test_partner_secret_key_123456789'
  const mockExternalUserId = 'external-user-123'
  const mockInternalUserId = 'internal-user-456'

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock vendor data
    const { getVendorById } = require('@/lib/db/vendors')
    getVendorById.mockResolvedValue({
      id: mockVendorId,
      name: 'Test Vendor',
      api_key: mockApiKey,
      partner_secret: mockPartnerSecret,
    })

    // Mock user upsert
    const { upsertUserFromExternalId } = require('@/lib/db/users')
    upsertUserFromExternalId.mockResolvedValue({
      id: mockInternalUserId,
      email: `external_${mockVendorId}_${mockExternalUserId}@coupon-dispenser.local`,
    })

    // Mock coupons
    const { getAvailableCouponsByVendor } = require('@/lib/db/coupons')
    getAvailableCouponsByVendor.mockResolvedValue([
      {
        id: 'coupon-1',
        code: 'COUPON1',
        vendor_id: mockVendorId,
        description: 'Test Coupon 1',
        discount_value: '10% Off',
        is_claimed: false,
      },
    ])

    // Mock claim
    const { atomicClaimCoupon } = require('@/lib/db/coupons')
    atomicClaimCoupon.mockResolvedValue({
      coupon_code: 'COUPON1',
    })

    // Mock Redis
    const { checkJtiReplay } = require('@/lib/redis/client')
    checkJtiReplay.mockResolvedValue(true)
  })

  describe('API Key Method (Simple)', () => {
    it('should create widget session from API key', async () => {
      const request = new NextRequest('http://localhost/api/widget-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: mockApiKey,
          vendor_id: mockVendorId,
          user_id: mockExternalUserId,
        }),
      })

      const response = await widgetSessionPOST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toHaveProperty('session_token')
      expect(data.data).toHaveProperty('user_id')
      expect(data.data).toHaveProperty('vendor_id', mockVendorId)
    })

    it('should fetch available coupons with widget session token', async () => {
      // First create session
      const sessionToken = signWidgetSession({
        user_id: mockInternalUserId,
        vendor_id: mockVendorId,
      })

      const request = new NextRequest(`http://localhost/api/available-coupons?vendor=${mockVendorId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${sessionToken}`,
        },
      })

      const response = await availableCouponsGET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toHaveProperty('coupons')
    })

    it('should claim coupon using widget session token', async () => {
      const sessionToken = signWidgetSession({
        user_id: mockInternalUserId,
        vendor_id: mockVendorId,
      })

      const request = new NextRequest('http://localhost/api/claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({
          coupon_id: 'coupon-1',
        }),
      })

      const response = await claimPOST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data).toHaveProperty('coupon_code', 'COUPON1')
    })

    it('should reject invalid API key', async () => {
      const request = new NextRequest('http://localhost/api/widget-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: 'invalid-key',
          vendor_id: mockVendorId,
          user_id: mockExternalUserId,
        }),
      })

      const response = await widgetSessionPOST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Invalid API key')
    })
  })

  describe('JWT Method (Advanced)', () => {
    it('should create widget session from partner JWT token', async () => {
      const jti = `jti-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`
      
      const partnerToken = jwt.sign(
        {
          vendor: mockVendorId,
          external_user_id: mockExternalUserId,
          jti: jti,
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 180, // 3 minutes
        },
        mockPartnerSecret,
        { algorithm: 'HS256' }
      )

      const request = new NextRequest('http://localhost/api/session-from-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: partnerToken }),
      })

      const response = await sessionFromTokenPOST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toHaveProperty('session_token')
      expect(data.data).toHaveProperty('user_id')
      expect(data.data).toHaveProperty('vendor_id', mockVendorId)
    })

    it('should reject expired JWT token', async () => {
      const jti = `jti-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`
      
      const partnerToken = jwt.sign(
        {
          vendor: mockVendorId,
          external_user_id: mockExternalUserId,
          jti: jti,
          iat: Math.floor(Date.now() / 1000) - 300, // 5 minutes ago
          exp: Math.floor(Date.now() / 1000) - 180, // 3 minutes ago (expired)
        },
        mockPartnerSecret,
        { algorithm: 'HS256' }
      )

      const request = new NextRequest('http://localhost/api/session-from-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: partnerToken }),
      })

      const response = await sessionFromTokenPOST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error).toContain('expired')
    })

    it('should reject replayed JWT token (jti)', async () => {
      const { checkJtiReplay } = require('@/lib/redis/client')
      checkJtiReplay.mockResolvedValue(false) // Replay detected

      const jti = 'replayed-jti-123'
      
      const partnerToken = jwt.sign(
        {
          vendor: mockVendorId,
          external_user_id: mockExternalUserId,
          jti: jti,
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 180,
        },
        mockPartnerSecret,
        { algorithm: 'HS256' }
      )

      const request = new NextRequest('http://localhost/api/session-from-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: partnerToken }),
      })

      const response = await sessionFromTokenPOST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error).toContain('replay')
    })
  })

  describe('Monthly Limit Enforcement', () => {
    it('should prevent user from claiming multiple coupons in same month', async () => {
      const { atomicClaimCoupon } = require('@/lib/db/coupons')
      
      // First claim succeeds
      atomicClaimCoupon.mockResolvedValueOnce({
        coupon_code: 'COUPON1',
      })

      const sessionToken = signWidgetSession({
        user_id: mockInternalUserId,
        vendor_id: mockVendorId,
      })

      // First claim
      const request1 = new NextRequest('http://localhost/api/claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({ coupon_id: 'coupon-1' }),
      })

      const response1 = await claimPOST(request1)
      expect(response1.status).toBe(200)

      // Second claim should fail (user already claimed this month)
      atomicClaimCoupon.mockRejectedValueOnce({
        code: '23505', // Unique constraint violation
        constraint: 'unique_user_vendor_month',
        message: 'duplicate key value violates unique constraint "unique_user_vendor_month"',
      })

      const request2 = new NextRequest('http://localhost/api/claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({ coupon_id: 'coupon-2' }),
      })

      const response2 = await claimPOST(request2)
      const data2 = await response2.json()

      expect(response2.status).toBe(409)
      expect(data2.success).toBe(false)
      expect(data2.error).toBe('USER_ALREADY_CLAIMED')
    })

    it('should prevent coupon from being claimed twice (permanent claim)', async () => {
      const { atomicClaimCoupon } = require('@/lib/db/coupons')
      
      // First claim succeeds
      atomicClaimCoupon.mockResolvedValueOnce({
        coupon_code: 'COUPON1',
      })

      const sessionToken1 = signWidgetSession({
        user_id: mockInternalUserId,
        vendor_id: mockVendorId,
      })

      // User 1 claims coupon
      const request1 = new NextRequest('http://localhost/api/claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken1}`,
        },
        body: JSON.stringify({ coupon_id: 'coupon-1' }),
      })

      await claimPOST(request1)

      // Second user tries to claim same coupon - should fail
      atomicClaimCoupon.mockRejectedValueOnce({
        code: '23505',
        constraint: 'unique_coupon_claim',
        message: 'duplicate key value violates unique constraint "unique_coupon_claim"',
      })

      const sessionToken2 = signWidgetSession({
        user_id: 'another-user-id',
        vendor_id: mockVendorId,
      })

      const request2 = new NextRequest('http://localhost/api/claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken2}`,
        },
        body: JSON.stringify({ coupon_id: 'coupon-1' }),
      })

      const response2 = await claimPOST(request2)
      const data2 = await response2.json()

      expect(response2.status).toBe(409)
      expect(data2.success).toBe(false)
      expect(data2.error).toBe('COUPON_ALREADY_CLAIMED')
    })
  })

  describe('Concurrent Claim Scenarios', () => {
    it('should handle concurrent claims atomically', async () => {
      const { atomicClaimCoupon } = require('@/lib/db/coupons')
      
      // Simulate race condition: first call succeeds, second fails
      atomicClaimCoupon
        .mockResolvedValueOnce({ coupon_code: 'COUPON1' })
        .mockRejectedValueOnce({
          code: '23505',
          constraint: 'unique_coupon_claim',
          message: 'duplicate key value violates unique constraint',
        })

      const sessionToken = signWidgetSession({
        user_id: mockInternalUserId,
        vendor_id: mockVendorId,
      })

      // Simulate two concurrent requests
      const promises = [
        claimPOST(new NextRequest('http://localhost/api/claim', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionToken}`,
          },
          body: JSON.stringify({ coupon_id: 'coupon-1' }),
        })),
        claimPOST(new NextRequest('http://localhost/api/claim', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionToken}`,
          },
          body: JSON.stringify({ coupon_id: 'coupon-1' }),
        })),
      ]

      const responses = await Promise.all(promises)
      
      // One should succeed, one should fail
      const statusCodes = responses.map(r => r.status)
      expect(statusCodes).toContain(200)
      expect(statusCodes).toContain(409)
      
      // Exactly one should succeed
      const successCount = responses.filter(r => r.status === 200).length
      expect(successCount).toBe(1)
    })
  })

  describe('Complete Integration Flow', () => {
    it('should complete full flow: API Key → Session → Coupons → Claim', async () => {
      // Step 1: Create widget session using API key
      const sessionRequest = new NextRequest('http://localhost/api/widget-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: mockApiKey,
          vendor_id: mockVendorId,
          user_id: mockExternalUserId,
        }),
      })

      const sessionResponse = await widgetSessionPOST(sessionRequest)
      const sessionData = await sessionResponse.json()
      const sessionToken = sessionData.data.session_token

      expect(sessionResponse.status).toBe(200)
      expect(sessionToken).toBeDefined()

      // Step 2: Fetch available coupons
      const couponsRequest = new NextRequest(`http://localhost/api/available-coupons?vendor=${mockVendorId}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${sessionToken}` },
      })

      const couponsResponse = await availableCouponsGET(couponsRequest)
      const couponsData = await couponsResponse.json()

      expect(couponsResponse.status).toBe(200)
      expect(couponsData.data.coupons).toBeInstanceOf(Array)
      expect(couponsData.data.coupons.length).toBeGreaterThan(0)

      // Step 3: Claim a coupon
      const claimRequest = new NextRequest('http://localhost/api/claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({
          coupon_id: couponsData.data.coupons[0].id,
        }),
      })

      const claimResponse = await claimPOST(claimRequest)
      const claimData = await claimResponse.json()

      expect(claimResponse.status).toBe(200)
      expect(claimData.success).toBe(true)
      expect(claimData).toHaveProperty('coupon_code')
    })
  })
})

