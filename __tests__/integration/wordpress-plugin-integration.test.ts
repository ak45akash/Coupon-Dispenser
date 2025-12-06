/**
 * End-to-End Integration Tests for WordPress Plugin
 * Tests the complete flow from plugin generation to widget rendering
 */

import { POST } from '@/app/api/widget-session/route'
import { NextRequest } from 'next/server'
import { getVendorById } from '@/lib/db/vendors'
import { upsertUserFromExternalId } from '@/lib/db/users'
import { signWidgetSession } from '@/lib/jwt/widget-session'
import { promises as fs } from 'fs'
import path from 'path'

// Mock dependencies
jest.mock('@/lib/db/vendors')
jest.mock('@/lib/db/users')
jest.mock('@/lib/jwt/widget-session')

const mockGetVendorById = getVendorById as jest.MockedFunction<typeof getVendorById>
const mockUpsertUserFromExternalId = upsertUserFromExternalId as jest.MockedFunction<typeof upsertUserFromExternalId>
const mockSignWidgetSession = signWidgetSession as jest.MockedFunction<typeof signWidgetSession>

describe('WordPress Plugin Integration - End-to-End', () => {
  const mockVendorId = '550e8400-e29b-41d4-a716-446655440000'
  const mockApiKey = 'cdk_test_api_key_123456789'
  const mockWordPressUserId = '123' // WordPress user ID (string)
  const mockInternalUserId = 'internal-user-456'
  const mockWidgetSessionToken = 'widget-session-token-123'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Plugin → Widget Session Token Flow', () => {
    it('should handle WordPress plugin REST API request flow', async () => {
      // Step 1: WordPress plugin calls /api/widget-session
      // This simulates what happens when the plugin's REST endpoint calls our API
      
      mockGetVendorById.mockResolvedValue({
        id: mockVendorId,
        name: 'Test Vendor',
        api_key: mockApiKey,
      } as any)

      mockUpsertUserFromExternalId.mockResolvedValue({
        id: mockInternalUserId,
        email: `external_${mockVendorId}_${mockWordPressUserId}@coupon-dispenser.local`,
      } as any)

      mockSignWidgetSession.mockReturnValue(mockWidgetSessionToken)

      // Simulate the request that WordPress plugin makes
      const request = new NextRequest('http://localhost/api/widget-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: mockApiKey,
          vendor_id: mockVendorId,
          user_id: mockWordPressUserId, // WordPress user ID as string
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      // Verify response matches what WordPress plugin expects
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toHaveProperty('session_token')
      expect(data.data.session_token).toBe(mockWidgetSessionToken)
      
      // Verify the flow
      expect(mockGetVendorById).toHaveBeenCalledWith(mockVendorId)
      expect(mockUpsertUserFromExternalId).toHaveBeenCalledWith(
        mockVendorId,
        mockWordPressUserId
      )
      expect(mockSignWidgetSession).toHaveBeenCalledWith({
        user_id: mockInternalUserId,
        vendor_id: mockVendorId,
      })
    })

    it('should handle WordPress plugin with logged-out user', async () => {
      // WordPress plugin should handle this, but our API should reject if needed
      mockGetVendorById.mockResolvedValue({
        id: mockVendorId,
        name: 'Test Vendor',
        api_key: mockApiKey,
      } as any)

      // Simulate missing user_id (logged out user)
      const request = new NextRequest('http://localhost/api/widget-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: mockApiKey,
          vendor_id: mockVendorId,
          // user_id is missing - logged out user
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
    })
  })

  describe('Plugin Configuration Validation', () => {
    it('should validate plugin files contain correct structure', async () => {
      const pluginDir = path.join(process.cwd(), 'wordpress-plugin')
      
      // Check main plugin file
      const mainFile = path.join(pluginDir, 'coupon-dispenser-widget.php')
      const mainContent = await fs.readFile(mainFile, 'utf-8')
      
      // Should have REST API endpoint registration
      expect(mainContent).toContain('register_rest_route')
      expect(mainContent).toContain("'coupon-dispenser/v1'")
      expect(mainContent).toContain("'/token'")
      
      // Should call our widget-session endpoint
      expect(mainContent).toContain('/api/widget-session')
      
      // Should handle user authentication
      expect(mainContent).toContain('is_user_logged_in')
      expect(mainContent).toContain('get_current_user_id')
    })

    it('should validate shortcode renders correct HTML structure', async () => {
      const shortcodeFile = path.join(process.cwd(), 'wordpress-plugin/includes/class-shortcode.php')
      const shortcodeContent = await fs.readFile(shortcodeFile, 'utf-8')
      
      // Should render widget container
      expect(shortcodeContent).toContain('<div')
      expect(shortcodeContent).toContain('coupon-dispenser-widget-container')
      
      // Should include data attributes for widget initialization
      expect(shortcodeContent).toContain('data-vendor-id')
      expect(shortcodeContent).toContain('data-api-key-endpoint')
      
      // Should enqueue widget script
      expect(shortcodeContent).toContain('wp_enqueue_script')
    })

    it('should validate settings page allows API key updates', async () => {
      const settingsFile = path.join(process.cwd(), 'wordpress-plugin/includes/class-settings.php')
      const settingsContent = await fs.readFile(settingsFile, 'utf-8')
      
      // Should have settings form
      expect(settingsContent).toContain('register_setting')
      expect(settingsContent).toContain('cdw_api_key')
      
      // Should allow manual API key input
      expect(settingsContent).toContain('type="password"')
      expect(settingsContent).toContain('name="cdw_api_key"')
      
      // Should read from options (allowing manual updates)
      expect(settingsContent).toContain('get_option')
    })
  })

  describe('Plugin → Widget Integration', () => {
    it('should return token format compatible with widget', async () => {
      mockGetVendorById.mockResolvedValue({
        id: mockVendorId,
        name: 'Test Vendor',
        api_key: mockApiKey,
      } as any)

      mockUpsertUserFromExternalId.mockResolvedValue({
        id: mockInternalUserId,
        email: `external_${mockVendorId}_${mockWordPressUserId}@coupon-dispenser.local`,
      } as any)

      mockSignWidgetSession.mockReturnValue(mockWidgetSessionToken)

      const request = new NextRequest('http://localhost/api/widget-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: mockApiKey,
          vendor_id: mockVendorId,
          user_id: mockWordPressUserId,
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      // Widget expects this exact structure
      expect(data).toMatchObject({
        success: true,
        data: {
          session_token: expect.any(String),
          user_id: expect.any(String),
          vendor_id: expect.any(String),
        },
      })
    })

    it('should handle concurrent requests from same WordPress user', async () => {
      mockGetVendorById.mockResolvedValue({
        id: mockVendorId,
        name: 'Test Vendor',
        api_key: mockApiKey,
      } as any)

      mockUpsertUserFromExternalId.mockResolvedValue({
        id: mockInternalUserId,
        email: `external_${mockVendorId}_${mockWordPressUserId}@coupon-dispenser.local`,
      } as any)

      mockSignWidgetSession.mockReturnValue(mockWidgetSessionToken)

      // Simulate multiple concurrent requests (e.g., multiple widget instances)
      const requests = Array(5).fill(null).map(() => 
        POST(new NextRequest('http://localhost/api/widget-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            api_key: mockApiKey,
            vendor_id: mockVendorId,
            user_id: mockWordPressUserId,
          }),
        }))
      )

      const responses = await Promise.all(requests)
      
      // All should succeed
      responses.forEach(async (response) => {
        expect(response.status).toBe(200)
        const data = await response.json()
        expect(data.success).toBe(true)
        expect(data.data.session_token).toBe(mockWidgetSessionToken)
      })
    })
  })

  describe('Error Handling in Plugin Flow', () => {
    it('should return proper error when API key is invalid', async () => {
      mockGetVendorById.mockResolvedValue({
        id: mockVendorId,
        name: 'Test Vendor',
        api_key: mockApiKey,
      } as any)

      const request = new NextRequest('http://localhost/api/widget-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: 'wrong-key',
          vendor_id: mockVendorId,
          user_id: mockWordPressUserId,
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Invalid API key')
    })

    it('should return proper error when vendor not found', async () => {
      mockGetVendorById.mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/widget-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: mockApiKey,
          vendor_id: 'non-existent-vendor',
          user_id: mockWordPressUserId,
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Vendor not found')
    })
  })
})

