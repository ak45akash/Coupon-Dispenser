/**
 * Tests for GET/POST /api/vendors/[id]/api-key
 * Tests API key management endpoints
 */

import { GET, POST } from '@/app/api/vendors/[id]/api-key/route'
import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getVendorById, hasVendorAccess } from '@/lib/db/vendors'
import { supabaseAdmin } from '@/lib/supabase/server'

// Mock dependencies
jest.mock('next-auth')
jest.mock('@/lib/auth')
jest.mock('@/lib/db/vendors')
jest.mock('@/lib/supabase/server')

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>
const mockGetVendorById = getVendorById as jest.MockedFunction<typeof getVendorById>
const mockHasVendorAccess = hasVendorAccess as jest.MockedFunction<typeof hasVendorAccess>
const mockSupabaseAdmin = supabaseAdmin as jest.Mocked<any>

describe('GET /api/vendors/[id]/api-key', () => {
  const mockVendorId = '550e8400-e29b-41d4-a716-446655440000'
  const mockApiKey = 'cdk_test_api_key_123456789abcdef'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return masked API key for super admin', async () => {
    mockGetServerSession.mockResolvedValue({
      user: {
        id: 'admin-user',
        email: 'admin@example.com',
        role: 'super_admin',
      },
    } as any)

    mockGetVendorById.mockResolvedValue({
      id: mockVendorId,
      name: 'Test Vendor',
      api_key: mockApiKey,
    } as any)

    const request = new NextRequest(`http://localhost/api/vendors/${mockVendorId}/api-key`)
    const response = await GET(request, { params: Promise.resolve({ id: mockVendorId }) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toHaveProperty('has_key', true)
    expect(data.data.masked_key).toContain('****')
    expect(data.data.masked_key).toContain(mockApiKey.slice(-8))
  })

  it('should return null when API key does not exist', async () => {
    mockGetServerSession.mockResolvedValue({
      user: {
        id: 'admin-user',
        email: 'admin@example.com',
        role: 'super_admin',
      },
    } as any)

    mockGetVendorById.mockResolvedValue({
      id: mockVendorId,
      name: 'Test Vendor',
      api_key: null,
    } as any)

    const request = new NextRequest(`http://localhost/api/vendors/${mockVendorId}/api-key`)
    const response = await GET(request, { params: Promise.resolve({ id: mockVendorId }) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toHaveProperty('has_key', false)
    expect(data.data.masked_key).toBeNull()
  })
})

describe('POST /api/vendors/[id]/api-key', () => {
  const mockVendorId = '550e8400-e29b-41d4-a716-446655440000'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should generate new API key', async () => {
    mockGetServerSession.mockResolvedValue({
      user: {
        id: 'admin-user',
        email: 'admin@example.com',
        role: 'super_admin',
      },
    } as any)

    mockGetVendorById.mockResolvedValue({
      id: mockVendorId,
      name: 'Test Vendor',
    } as any)

    mockSupabaseAdmin.from.mockReturnValue({
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      }),
    })

    const request = new NextRequest(`http://localhost/api/vendors/${mockVendorId}/api-key`, {
      method: 'POST',
    })

    const response = await POST(request, { params: Promise.resolve({ id: mockVendorId }) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toHaveProperty('api_key')
    expect(data.data.api_key).toMatch(/^cdk_/)
  })
})

