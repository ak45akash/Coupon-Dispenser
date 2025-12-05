/**
 * Tests for POST /api/widget-session
 * Tests API Key method for widget session creation
 */

import { POST } from '@/app/api/widget-session/route'
import { NextRequest } from 'next/server'
import { getVendorById } from '@/lib/db/vendors'
import { upsertUserFromExternalId } from '@/lib/db/users'
import { signWidgetSession } from '@/lib/jwt/widget-session'

// Mock dependencies
jest.mock('@/lib/db/vendors')
jest.mock('@/lib/db/users')
jest.mock('@/lib/jwt/widget-session')

const mockGetVendorById = getVendorById as jest.MockedFunction<typeof getVendorById>
const mockUpsertUserFromExternalId = upsertUserFromExternalId as jest.MockedFunction<typeof upsertUserFromExternalId>
const mockSignWidgetSession = signWidgetSession as jest.MockedFunction<typeof signWidgetSession>

describe('POST /api/widget-session', () => {
  const mockVendorId = '550e8400-e29b-41d4-a716-446655440000'
  const mockApiKey = 'cdk_test_api_key_123456789'
  const mockExternalUserId = 'external-user-123'
  const mockInternalUserId = 'internal-user-456'
  const mockWidgetSessionToken = 'widget-session-token-123'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should create widget session with API key and user_id', async () => {
    mockGetVendorById.mockResolvedValue({
      id: mockVendorId,
      name: 'Test Vendor',
      api_key: mockApiKey,
    } as any)

    mockUpsertUserFromExternalId.mockResolvedValue({
      id: mockInternalUserId,
      email: `external_${mockVendorId}_${mockExternalUserId}@coupon-dispenser.local`,
    } as any)

    mockSignWidgetSession.mockReturnValue(mockWidgetSessionToken)

    const request = new NextRequest('http://localhost/api/widget-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: mockApiKey,
        vendor_id: mockVendorId,
        user_id: mockExternalUserId,
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toHaveProperty('session_token', mockWidgetSessionToken)
    expect(data.data).toHaveProperty('user_id', mockInternalUserId)
    expect(data.data).toHaveProperty('vendor_id', mockVendorId)

    expect(mockGetVendorById).toHaveBeenCalledWith(mockVendorId)
    expect(mockUpsertUserFromExternalId).toHaveBeenCalledWith(mockVendorId, mockExternalUserId)
    expect(mockSignWidgetSession).toHaveBeenCalledWith({
      user_id: mockInternalUserId,
      vendor_id: mockVendorId,
    })
  })

  it('should create widget session with API key and user_email', async () => {
    const userEmail = 'user@example.com'

    mockGetVendorById.mockResolvedValue({
      id: mockVendorId,
      name: 'Test Vendor',
      api_key: mockApiKey,
    } as any)

    mockUpsertUserFromExternalId.mockResolvedValue({
      id: mockInternalUserId,
      email: `external_${mockVendorId}_${userEmail}@coupon-dispenser.local`,
    } as any)

    mockSignWidgetSession.mockReturnValue(mockWidgetSessionToken)

    const request = new NextRequest('http://localhost/api/widget-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: mockApiKey,
        vendor_id: mockVendorId,
        user_email: userEmail,
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(mockUpsertUserFromExternalId).toHaveBeenCalledWith(mockVendorId, userEmail)
  })

  it('should reject invalid API key', async () => {
    mockGetVendorById.mockResolvedValue({
      id: mockVendorId,
      name: 'Test Vendor',
      api_key: mockApiKey,
    } as any)

    const request = new NextRequest('http://localhost/api/widget-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: 'invalid-key',
        vendor_id: mockVendorId,
        user_id: mockExternalUserId,
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.success).toBe(false)
    expect(data.error).toContain('Invalid API key')
  })

  it('should reject when vendor not found', async () => {
    mockGetVendorById.mockResolvedValue(null)

    const request = new NextRequest('http://localhost/api/widget-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: mockApiKey,
        vendor_id: mockVendorId,
        user_id: mockExternalUserId,
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.success).toBe(false)
    expect(data.error).toContain('Vendor not found')
  })

  it('should reject when vendor has no API key configured', async () => {
    mockGetVendorById.mockResolvedValue({
      id: mockVendorId,
      name: 'Test Vendor',
      api_key: null,
    } as any)

    const request = new NextRequest('http://localhost/api/widget-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: mockApiKey,
        vendor_id: mockVendorId,
        user_id: mockExternalUserId,
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toContain('API key configured')
  })

  it('should reject when neither user_id nor user_email provided', async () => {
    const request = new NextRequest('http://localhost/api/widget-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: mockApiKey,
        vendor_id: mockVendorId,
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toBeDefined()
  })

  it('should handle user upsert errors', async () => {
    mockGetVendorById.mockResolvedValue({
      id: mockVendorId,
      name: 'Test Vendor',
      api_key: mockApiKey,
    } as any)

    mockUpsertUserFromExternalId.mockRejectedValue(new Error('Database error'))

    const request = new NextRequest('http://localhost/api/widget-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: mockApiKey,
        vendor_id: mockVendorId,
        user_id: mockExternalUserId,
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.error).toContain('Failed to create user mapping')
  })
})

