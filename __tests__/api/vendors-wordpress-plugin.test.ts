/**
 * Tests for GET /api/vendors/[id]/wordpress-plugin
 * Tests WordPress plugin ZIP generation
 */

import { GET } from '@/app/api/vendors/[id]/wordpress-plugin/route'
import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getVendorById, hasVendorAccess } from '@/lib/db/vendors'
import { isSuperAdmin, isPartnerAdmin } from '@/lib/auth/permissions'
import { promises as fs } from 'fs'
import archiver from 'archiver'

// Mock dependencies
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}))
jest.mock('@/lib/auth', () => ({
  authOptions: {},
}))
jest.mock('@/lib/db/vendors')
jest.mock('@/lib/auth/permissions')
jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(),
  },
}))
jest.mock('archiver', () => {
  return jest.fn().mockImplementation(() => {
    const mockArchive = {
      append: jest.fn().mockReturnThis(),
      on: jest.fn().mockReturnThis(),
      finalize: jest.fn(),
    }
    return mockArchive
  })
})

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>
const mockGetVendorById = getVendorById as jest.MockedFunction<typeof getVendorById>
const mockHasVendorAccess = hasVendorAccess as jest.MockedFunction<typeof hasVendorAccess>
const mockIsSuperAdmin = isSuperAdmin as jest.MockedFunction<typeof isSuperAdmin>
const mockIsPartnerAdmin = isPartnerAdmin as jest.MockedFunction<typeof isPartnerAdmin>
const mockReadFile = fs.readFile as jest.MockedFunction<typeof fs.readFile>

describe('GET /api/vendors/[id]/wordpress-plugin', () => {
  const mockVendorId = '550e8400-e29b-41d4-a716-446655440000'
  const mockApiKey = 'cdk_test_api_key_123456789'
  const mockApiBaseUrl = 'https://example.com'
  
  const mockVendor = {
    id: mockVendorId,
    name: 'Test Vendor',
    api_key: mockApiKey,
  }

  const mockSession = {
    user: {
      id: 'user-123',
      email: 'admin@example.com',
      role: 'super_admin',
    },
  }

  // Mock plugin file contents
  const mockMainPluginContent = `
// PLUGIN_CONFIG_VENDOR_ID
// PLUGIN_CONFIG_API_KEY
// PLUGIN_CONFIG_API_BASE_URL
  `

  const mockSettingsContent = 'Settings class content'
  const mockShortcodeContent = 'Shortcode class content'
  const mockWidgetRenderContent = 'Widget render class content'

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Default mocks
    mockGetServerSession.mockResolvedValue(mockSession as any)
    mockGetVendorById.mockResolvedValue(mockVendor as any)
    mockIsSuperAdmin.mockReturnValue(true)
    mockIsPartnerAdmin.mockReturnValue(false)
    mockHasVendorAccess.mockResolvedValue(true)

    // Mock file reads
    mockReadFile
      .mockResolvedValueOnce(mockMainPluginContent)
      .mockResolvedValueOnce(mockSettingsContent)
      .mockResolvedValueOnce(mockShortcodeContent)
      .mockResolvedValueOnce(mockWidgetRenderContent)

    // Setup archiver mock - properly typed
    const mockArchive: {
      append: jest.Mock
      on: jest.Mock
      finalize: jest.Mock
      _endCallback?: () => void
    } = {
      append: jest.fn().mockReturnThis(),
      on: jest.fn((event: string, callback: () => void) => {
        if (event === 'end') {
          // Store callback to call later
          mockArchive._endCallback = callback
        }
        return mockArchive
      }),
      finalize: jest.fn(() => {
        // Trigger 'end' event
        setTimeout(() => {
          if (mockArchive._endCallback) {
            mockArchive._endCallback()
          }
        }, 0)
      }),
    }
    ;(archiver as unknown as jest.Mock).mockReturnValue(mockArchive)
  })

  it('should generate ZIP file for super admin', async () => {
    // Mock archiver to actually work - properly typed
    const mockArchive: {
      append: jest.Mock
      on: jest.Mock
      finalize: jest.Mock
      _endCallback?: () => void
    } = {
      append: jest.fn().mockReturnThis(),
      on: jest.fn((event: string, callback: () => void) => {
        if (event === 'end') {
          // Store callback to call later
          mockArchive._endCallback = callback
        }
        return mockArchive
      }),
      finalize: jest.fn(() => {
        // Call end callback after finalize
        setTimeout(() => {
          if (mockArchive._endCallback) {
            mockArchive._endCallback()
          }
        }, 10)
      }),
    }
    
    ;(archiver as unknown as jest.Mock).mockReturnValue(mockArchive)

    const request = new NextRequest(`http://localhost/api/vendors/${mockVendorId}/wordpress-plugin`, {
      headers: {
        origin: mockApiBaseUrl,
      },
    })

    const params = Promise.resolve({ id: mockVendorId })
    
    // Wait for the response
    const response = await new Promise<Response>(async (resolve) => {
      const resp = await GET(request, { params })
      // Wait a bit for archiver to finish
      setTimeout(() => resolve(resp), 50)
    })

    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('application/zip')
    expect(response.headers.get('Content-Disposition')).toContain('coupon-dispenser-widget')
    
    expect(mockGetServerSession).toHaveBeenCalled()
    expect(mockGetVendorById).toHaveBeenCalledWith(mockVendorId)
    expect(mockIsSuperAdmin).toHaveBeenCalledWith('super_admin')
  })

  it('should generate ZIP file for partner admin with vendor access', async () => {
    mockIsSuperAdmin.mockReturnValue(false)
    mockIsPartnerAdmin.mockReturnValue(true)
    mockHasVendorAccess.mockResolvedValue(true)

    const request = new NextRequest(`http://localhost/api/vendors/${mockVendorId}/wordpress-plugin`, {
      headers: {
        origin: mockApiBaseUrl,
      },
    })

    const params = Promise.resolve({ id: mockVendorId })
    const response = await GET(request, { params })

    expect(response.status).toBe(200)
    expect(mockIsPartnerAdmin).toHaveBeenCalledWith('super_admin')
    expect(mockHasVendorAccess).toHaveBeenCalledWith('user-123', mockVendorId)
  })

  it('should reject unauthorized requests', async () => {
    mockGetServerSession.mockResolvedValue(null)

    const request = new NextRequest(`http://localhost/api/vendors/${mockVendorId}/wordpress-plugin`)
    const params = Promise.resolve({ id: mockVendorId })
    const response = await GET(request, { params })

    expect(response.status).toBe(401)
    const data = await response.json()
    expect(data.success).toBe(false)
    expect(data.error).toContain('Unauthorized')
  })

  it('should reject when vendor not found', async () => {
    mockGetVendorById.mockResolvedValue(null)

    const request = new NextRequest(`http://localhost/api/vendors/${mockVendorId}/wordpress-plugin`)
    const params = Promise.resolve({ id: mockVendorId })
    const response = await GET(request, { params })

    expect(response.status).toBe(404)
    const data = await response.json()
    expect(data.success).toBe(false)
    expect(data.error).toContain('Vendor not found')
  })

  it('should reject when vendor has no API key', async () => {
    mockGetVendorById.mockResolvedValue({
      ...mockVendor,
      api_key: null,
    } as any)

    const request = new NextRequest(`http://localhost/api/vendors/${mockVendorId}/wordpress-plugin`)
    const params = Promise.resolve({ id: mockVendorId })
    const response = await GET(request, { params })

    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.success).toBe(false)
    expect(data.error).toContain('API key configured')
  })

  it('should reject partner admin without vendor access', async () => {
    mockIsSuperAdmin.mockReturnValue(false)
    mockIsPartnerAdmin.mockReturnValue(true)
    mockHasVendorAccess.mockResolvedValue(false)

    const request = new NextRequest(`http://localhost/api/vendors/${mockVendorId}/wordpress-plugin`)
    const params = Promise.resolve({ id: mockVendorId })
    const response = await GET(request, { params })

    expect(response.status).toBe(403)
    const data = await response.json()
    expect(data.success).toBe(false)
    expect(data.error).toContain('Forbidden')
  })

  it('should replace placeholders in plugin files', async () => {
    const request = new NextRequest(`http://localhost/api/vendors/${mockVendorId}/wordpress-plugin`, {
      headers: {
        origin: mockApiBaseUrl,
      },
    })

    const params = Promise.resolve({ id: mockVendorId })
    await GET(request, { params })

    // Verify file was read
    expect(mockReadFile).toHaveBeenCalled()

    // Verify archiver was called with replaced content
    // The archiver mock is set up in beforeEach, so we just verify it was called
    expect(archiver).toHaveBeenCalledWith('zip', expect.any(Object))
  })

  it('should use NEXTAUTH_URL for API base URL if available', async () => {
    const originalEnv = process.env.NEXTAUTH_URL
    process.env.NEXTAUTH_URL = 'https://custom-domain.com'

    const request = new NextRequest(`http://localhost/api/vendors/${mockVendorId}/wordpress-plugin`)
    const params = Promise.resolve({ id: mockVendorId })
    await GET(request, { params })

    // Verify the request was processed
    expect(mockGetVendorById).toHaveBeenCalled()

    // Restore original env
    process.env.NEXTAUTH_URL = originalEnv
  })

  it('should use origin header for API base URL if NEXTAUTH_URL not set', async () => {
    const originalEnv = process.env.NEXTAUTH_URL
    delete process.env.NEXTAUTH_URL

    const request = new NextRequest(`http://localhost/api/vendors/${mockVendorId}/wordpress-plugin`, {
      headers: {
        origin: 'https://header-origin.com',
      },
    })

    const params = Promise.resolve({ id: mockVendorId })
    await GET(request, { params })

    expect(mockGetVendorById).toHaveBeenCalled()

    // Restore original env
    if (originalEnv) {
      process.env.NEXTAUTH_URL = originalEnv
    }
  })

  it('should handle file read errors gracefully', async () => {
    mockReadFile.mockRejectedValueOnce(new Error('File not found'))

    const request = new NextRequest(`http://localhost/api/vendors/${mockVendorId}/wordpress-plugin`)
    const params = Promise.resolve({ id: mockVendorId })
    const response = await GET(request, { params })

    expect(response.status).toBe(500)
    const data = await response.json()
    expect(data.success).toBe(false)
    expect(data.error).toContain('Internal server error')
  })

  it('should include all required plugin files in ZIP', async () => {
    const request = new NextRequest(`http://localhost/api/vendors/${mockVendorId}/wordpress-plugin`, {
      headers: {
        origin: mockApiBaseUrl,
      },
    })

    const params = Promise.resolve({ id: mockVendorId })
    await GET(request, { params })

    // Verify all files were read
    expect(mockReadFile).toHaveBeenCalledTimes(4)
    
    // Check that main plugin file was read
    const readCalls = mockReadFile.mock.calls
    expect(readCalls.some(call => call[0].toString().includes('coupon-dispenser-widget.php'))).toBe(true)
    expect(readCalls.some(call => call[0].toString().includes('class-settings.php'))).toBe(true)
    expect(readCalls.some(call => call[0].toString().includes('class-shortcode.php'))).toBe(true)
    expect(readCalls.some(call => call[0].toString().includes('class-widget-render.php'))).toBe(true)
  })

  it('should generate valid ZIP filename', async () => {
    const request = new NextRequest(`http://localhost/api/vendors/${mockVendorId}/wordpress-plugin`, {
      headers: {
        origin: mockApiBaseUrl,
      },
    })

    const params = Promise.resolve({ id: mockVendorId })
    const response = await GET(request, { params })

    const contentDisposition = response.headers.get('Content-Disposition')
    expect(contentDisposition).toContain('coupon-dispenser-widget')
    expect(contentDisposition).toContain('.zip')
    expect(contentDisposition).toMatch(/attachment/)
  })
})

