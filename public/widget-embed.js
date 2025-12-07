/**
 * Coupon Dispenser Embeddable Widget
 * 
 * Card-based coupon widget for partner websites
 * 
 * Usage - JWT Method (Advanced):
 * <script src="https://your-domain.com/widget-embed.js"></script>
 * <div id="coupon-widget" 
 *      data-vendor-id="VENDOR_ID" 
 *      data-theme="light">
 * </div>
 * <script>
 *   // Partner's backend generates JWT token and calls:
 *   window.sendCouponToken('partner_jwt_token_here');
 * </script>
 * 
 * Usage - API Key Method (Simple):
 * <script src="https://your-domain.com/widget-embed.js"></script>
 * <div id="coupon-widget" 
 *      data-vendor-id="VENDOR_ID"
 *      data-api-key-endpoint="https://partner-site.com/api/coupon-token"
 *      data-theme="light">
 * </div>
 * 
 * Legacy Usage (Backward Compatible):
 * <script src="https://your-domain.com/widget-embed.js"></script>
 * <div id="coupon-widget" 
 *      data-vendor-id="VENDOR_ID" 
 *      data-user-id="USER_ID"
 *      data-theme="light">
 * </div>
 */

(function (window, document) {
  'use strict'

  // Configuration
  function getApiBaseUrl() {
    // Check for data attribute on script tag
    const script = document.querySelector('script[src*="widget-embed.js"]')
    if (script && script.getAttribute('data-api-url')) {
      return script.getAttribute('data-api-url')
    }
    
    // Check for global configuration
    if (window.COUPON_WIDGET_API_URL) {
      return window.COUPON_WIDGET_API_URL
    }
    
    // Try to extract from script src URL (for production)
    if (script && script.src) {
      try {
        const scriptUrl = new URL(script.src)
        return scriptUrl.origin
      } catch (e) {
        // Invalid URL, continue
      }
    }
    
    // Fallback to current origin (for same-domain embedding)
    if (window.location && window.location.origin) {
      return window.location.origin
    }
    
    // Last resort fallback
    return 'https://your-domain.com'
  }

  const CONFIG = {
    API_BASE_URL: getApiBaseUrl(),
    RATE_LIMIT_MS: 2000,
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000,
  }

  // Widget session token storage (in-memory, per instance)
  const widgetSessionTokens = new Map()

  const widgetState = {
    instances: new Map(),
    rateLimitTimers: new Map(),
  }

  function checkRateLimit(instanceId) {
    const lastClick = widgetState.rateLimitTimers.get(instanceId)
    if (lastClick) {
      const timeSinceLastClick = Date.now() - lastClick
      if (timeSinceLastClick < CONFIG.RATE_LIMIT_MS) {
        return false
      }
    }
    widgetState.rateLimitTimers.set(instanceId, Date.now())
    return true
  }

  function createStyles() {
    return `
      .coupon-widget-container {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        width: 100%;
        max-width: 1400px;
        margin: 0 auto;
        padding: 20px;
      }
      .coupon-widget-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
        gap: 24px;
        margin-top: 20px;
      }
      .coupon-widget-card {
        position: relative;
        background: #1a1a1a;
        border-radius: 12px;
        overflow: hidden;
        min-height: 400px;
        display: flex;
        flex-direction: column;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      }
      .coupon-widget-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
      }
      .coupon-widget-card-image {
        width: 100%;
        height: 200px;
        object-fit: cover;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      }
      .coupon-widget-card-content {
        padding: 24px;
        flex: 1;
        display: flex;
        flex-direction: column;
        color: #ffffff;
      }
      .coupon-widget-card-brand {
        font-size: 24px;
        font-weight: 700;
        margin-bottom: 8px;
        color: #ffffff;
      }
      .coupon-widget-card-offer {
        font-size: 18px;
        font-weight: 600;
        color: #ffffff;
        margin-bottom: 12px;
      }
      .coupon-widget-card-description {
        font-size: 14px;
        color: #a0a0a0;
        line-height: 1.6;
        margin-bottom: 20px;
        flex: 1;
      }
      .coupon-widget-code-section {
        margin-top: auto;
        padding-top: 20px;
        border-top: 1px solid #333333;
      }
      .coupon-widget-code-display {
        display: none;
        background: #2a2a2a;
        border: 2px dashed #444444;
        border-radius: 8px;
        padding: 16px;
        margin-bottom: 12px;
        text-align: center;
      }
      .coupon-widget-code-display.show {
        display: block;
        animation: fadeIn 0.3s ease;
      }
      .coupon-widget-code-value {
        font-size: 24px;
        font-weight: 700;
        color: #60a5fa;
        letter-spacing: 2px;
        margin: 8px 0;
        font-family: 'Monaco', 'Courier New', monospace;
      }
      .coupon-widget-code-label {
        font-size: 12px;
        color: #a0a0a0;
        text-transform: uppercase;
        letter-spacing: 1px;
      }
      .coupon-widget-button {
        width: 100%;
        padding: 14px 24px;
        font-size: 16px;
        font-weight: 600;
        color: #ffffff;
        background: #ff6b35;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s ease;
        margin-bottom: 12px;
      }
      .coupon-widget-button:hover:not(:disabled) {
        background: #e55a2b;
        transform: translateY(-1px);
      }
      .coupon-widget-button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
      .coupon-widget-button.loading {
        position: relative;
        color: transparent;
      }
      .coupon-widget-button.loading::after {
        content: '';
        position: absolute;
        width: 20px;
        height: 20px;
        top: 50%;
        left: 50%;
        margin-left: -10px;
        margin-top: -10px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-top-color: #ffffff;
        border-radius: 50%;
        animation: spin 0.6s linear infinite;
      }
      .coupon-widget-copy-button {
        width: 100%;
        padding: 10px;
        font-size: 14px;
        color: #ffffff;
        background: #2a2a2a;
        border: 1px solid #444444;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s ease;
        display: none;
      }
      .coupon-widget-copy-button.show {
        display: block;
      }
      .coupon-widget-copy-button:hover {
        background: #333333;
      }
      .coupon-widget-copy-button.copied {
        background: #10b981;
        border-color: #10b981;
      }
      .coupon-widget-link {
        display: block;
        text-align: center;
        color: #a0a0a0;
        font-size: 12px;
        text-decoration: none;
        margin-top: 8px;
        transition: color 0.2s ease;
      }
      .coupon-widget-link:hover {
        color: #ffffff;
      }
      .coupon-widget-error {
        background: #7f1d1d;
        border: 1px solid #991b1b;
        color: #fca5a5;
        padding: 12px;
        border-radius: 8px;
        margin: 12px 0;
        font-size: 14px;
        text-align: center;
      }
      .coupon-widget-empty {
        text-align: center;
        padding: 60px 20px;
        color: #a0a0a0;
      }
      .coupon-widget-empty-icon {
        font-size: 64px;
        margin-bottom: 16px;
        opacity: 0.5;
      }
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @media (max-width: 768px) {
        .coupon-widget-grid {
          grid-template-columns: 1fr;
        }
      }
    `
  }

  function injectStyles() {
    const styleId = 'coupon-widget-styles'
    if (document.getElementById(styleId)) {
      return
    }
    const style = document.createElement('style')
    style.id = styleId
    style.textContent = createStyles()
    document.head.appendChild(style)
  }

  /**
   * Convert partner token to widget session token
   * Called when partner provides token via window.sendCouponToken() or postMessage
   */
  async function createWidgetSessionFromToken(partnerToken, instanceId) {
    try {
      const response = await fetch(`${CONFIG.API_BASE_URL}/api/session-from-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: partnerToken }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const data = await response.json()
      if (!data.success) {
        throw new Error(data.error || 'Failed to create widget session')
      }

      // Store widget session token
      widgetSessionTokens.set(instanceId, data.data.session_token)
      
      return {
        session_token: data.data.session_token,
        user_id: data.data.user_id,
        vendor_id: data.data.vendor_id,
      }
    } catch (error) {
      console.error('CouponWidget: Error creating widget session from partner token:', error)
      throw error
    }
  }

  /**
   * Fetch widget session token from partner's backend (API Key Method)
   * Partner's backend endpoint should return { token: "widget_session_token" }
   * The partner's backend calls our /api/widget-session endpoint internally
   */
  async function fetchWidgetSessionFromApiKey(apiKeyEndpoint, instanceId) {
    try {
      if (!apiKeyEndpoint) {
        throw new Error('API key endpoint URL is required')
      }

      console.log('CouponWidget: Fetching widget session token from partner backend:', apiKeyEndpoint)

      // Try to detect WordPress user ID if available
      const wpUserId = detectUserId()
      
      // Build query parameters
      const queryParams = new URLSearchParams()
      
      // Priority: Pass WordPress user ID if available (for logged-in users)
      // Check if it's a WordPress user ID (numeric) or anonymous ID (starts with 'anon_' or 'anonymous-')
      if (wpUserId && !wpUserId.startsWith('anon_') && !wpUserId.startsWith('anonymous-')) {
        // This is a real WordPress user ID (numeric)
        queryParams.append('widget_user_id', wpUserId)
        console.log('CouponWidget: Passing WordPress user ID to plugin endpoint:', wpUserId)
      } else {
        // For anonymous users, pass the anonymous ID from localStorage
        const anonymousId = wpUserId || detectUserId() // Use wpUserId if it exists (even if anonymous), otherwise try to detect
        if (anonymousId && (anonymousId.startsWith('anon_') || anonymousId.startsWith('anonymous-'))) {
          queryParams.append('anonymous_id', anonymousId)
          console.log('CouponWidget: Passing anonymous ID to plugin endpoint:', anonymousId.substring(0, 20) + '...')
        }
      }

      const url = queryParams.toString() ? `${apiKeyEndpoint}?${queryParams.toString()}` : apiKeyEndpoint

      const response = await fetch(url, {
        method: 'GET',
        headers: { 
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for partner's auth
        mode: 'cors',
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      
      // Partner's endpoint should return { token: "..." } or { data: { session_token: "..." } }
      let widgetSessionToken = null
      
      if (data.token) {
        widgetSessionToken = data.token
      } else if (data.data && data.data.session_token) {
        widgetSessionToken = data.data.session_token
      } else if (data.session_token) {
        widgetSessionToken = data.session_token
      } else {
        throw new Error('Invalid response format: token not found in partner endpoint response')
      }

      if (!widgetSessionToken) {
        throw new Error('Widget session token not found in partner endpoint response')
      }

      // Store widget session token
      widgetSessionTokens.set(instanceId, widgetSessionToken)
      
      console.log('CouponWidget: Successfully fetched widget session token from partner backend')
      
      return {
        session_token: widgetSessionToken,
        user_id: null, // User ID is managed by widget session token
        vendor_id: null, // Vendor ID is managed by widget session token
      }
    } catch (error) {
      console.error('CouponWidget: Error fetching widget session from API key endpoint:', error)
      throw error
    }
  }

  async function fetchCouponsData(vendorId, userId, previewMode = false, retries = 0, widgetSessionToken = null) {
    // Preview mode: return mock data without making API call
    if (previewMode || userId === 'PREVIEW_MODE_USER_ID') {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 300))
      
      // Return mock data for preview
      return {
        vendor: {
          id: vendorId,
          name: 'Preview Vendor',
          description: 'This is a preview of your vendor widget',
          website: '#',
          logo_url: null,
        },
        coupons: [
          {
            id: 'preview-coupon-1',
            code: 'PREVIEW1',
            description: 'Preview Coupon 1 - This is how it will appear',
            discount_value: '20% Off',
            is_claimed: false,
            claimed_at: null,
            expiry_date: null,
          },
          {
            id: 'preview-coupon-2',
            code: 'PREVIEW2',
            description: 'Preview Coupon 2 - Test the widget appearance',
            discount_value: '15% Off',
            is_claimed: false,
            claimed_at: null,
            expiry_date: null,
          },
        ],
        has_active_claim: false,
        active_claim_expiry: null,
      }
    }

    try {
      // Use widget session token if available, otherwise fall back to legacy endpoint
      let url, headers
      
      if (widgetSessionToken) {
        // New endpoint with widget session authentication
        url = `${CONFIG.API_BASE_URL}/api/available-coupons?vendor=${vendorId}`
        headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${widgetSessionToken}`,
        }
      } else {
        // Legacy endpoint (backward compatibility)
        url = userId 
          ? `${CONFIG.API_BASE_URL}/api/widget/coupons?vendor_id=${vendorId}&user_id=${userId}`
          : `${CONFIG.API_BASE_URL}/api/widget/coupons?vendor_id=${vendorId}`
        headers = { 'Content-Type': 'application/json' }
      }
      
      const response = await fetch(url, {
        method: 'GET',
        headers: headers,
        mode: 'cors', // Explicitly enable CORS
      })

      if (!response.ok) {
        // Try to get error message from response
        let errorMessage = `HTTP ${response.status}`
        try {
          const errorData = await response.json()
          if (errorData.error) {
            errorMessage = errorData.error
          }
        } catch (e) {
          // If response is not JSON, use status text
          errorMessage = response.statusText || `HTTP ${response.status}`
        }
        throw new Error(errorMessage)
      }

      const data = await response.json()
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch coupons')
      }

      // Normalize response format (new endpoint uses different structure)
      if (data.data.coupons !== undefined) {
        // New endpoint format
        return {
          vendor: data.data.vendor || {},
          coupons: data.data.coupons || [],
          has_active_claim: data.data.user_already_claimed || false,
          active_claim_expiry: null,
        }
      }
      
      // Legacy endpoint format
      return data.data
    } catch (error) {
      if (retries < CONFIG.MAX_RETRIES) {
        await new Promise((resolve) => setTimeout(resolve, CONFIG.RETRY_DELAY))
        return fetchCouponsData(vendorId, userId, previewMode, retries + 1)
      }
      throw error
    }
  }

  async function claimCoupon(couponId, userId, previewMode = false, retries = 0, widgetSessionToken = null) {
    // Preview mode: return mock data without making API call
    if (previewMode || userId === 'PREVIEW_MODE_USER_ID') {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500))
      
      // Return mock claimed coupon data
      return {
        id: couponId,
        code: 'PREVIEW-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
        description: 'Preview coupon code (not actually claimed)',
        discount_value: 'Test Discount',
      }
    }

    try {
      let url, headers, body
      
      if (widgetSessionToken) {
        // New endpoint with widget session authentication
        url = `${CONFIG.API_BASE_URL}/api/claim`
        headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${widgetSessionToken}`,
        }
        body = JSON.stringify({
          coupon_id: couponId,
        })
      } else {
        // Legacy endpoint (backward compatibility)
        url = `${CONFIG.API_BASE_URL}/api/widget/claim`
        headers = { 'Content-Type': 'application/json' }
        body = JSON.stringify({
          coupon_id: couponId,
          user_id: userId,
        })
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: body,
      })

      const data = await response.json()

      if (!response.ok) {
        // Handle specific error codes
        if (response.status === 409) {
          if (data.error === 'COUPON_ALREADY_CLAIMED') {
            throw new Error('Coupon already claimed')
          } else if (data.error === 'USER_ALREADY_CLAIMED') {
            throw new Error('You have already claimed a coupon this month')
          }
        }
        throw new Error(data.error || 'Failed to claim coupon')
      }

      // Normalize response format
      if (data.coupon_code) {
        // New endpoint format
        return {
          id: couponId,
          code: data.coupon_code,
          description: null,
          discount_value: null,
        }
      }
      
      // Legacy endpoint format
      return data.data
    } catch (error) {
      if (retries < CONFIG.MAX_RETRIES) {
        await new Promise((resolve) => setTimeout(resolve, CONFIG.RETRY_DELAY))
        return claimCoupon(couponId, userId, previewMode, retries + 1)
      }
      throw error
    }
  }

  class CouponWidgetInstance {
    constructor(config) {
      this.config = {
        vendorId: config.vendorId || '',
        userId: config.userId || '',
        theme: config.theme || 'light',
        containerId: config.containerId || 'coupon-widget',
        previewMode: config.previewMode || false, // Preview mode for testing
        apiKeyEndpoint: config.apiKeyEndpoint || null, // Partner's backend endpoint for API key method
      }

      this.state = {
        loading: true,
        vendor: null,
        coupons: [],
        claimedCoupons: new Map(), // couponId -> claimed coupon data
        errors: new Map(), // couponId -> error message
        hasActiveClaim: false,
        activeClaimExpiry: null,
        widgetSessionToken: null, // Widget session token from partner token or API key endpoint
      }

      this.container = null
      this.instanceId = `${this.config.containerId}-${Date.now()}`
    }

    /**
     * Generate or retrieve an anonymous user ID for tracking
     * Uses localStorage to persist the ID across sessions
     */
    getOrCreateAnonymousUserId() {
      const storageKey = `coupon_widget_anonymous_user_${this.config.vendorId}`
      
      // Try to get existing ID from localStorage
      if (typeof Storage !== 'undefined') {
        const existingId = localStorage.getItem(storageKey)
        if (existingId) {
          return existingId
        }
      }

      // Generate a new anonymous user ID
      // Format: anonymous-{timestamp}-{random}
      const anonymousId = `anonymous-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`
      
      // Store in localStorage for persistence
      if (typeof Storage !== 'undefined') {
        try {
          localStorage.setItem(storageKey, anonymousId)
        } catch (e) {
          // localStorage might be disabled, that's okay
          console.warn('CouponWidget: Could not store anonymous user ID:', e)
        }
      }

      return anonymousId
    }

    async init() {
      this.container = document.getElementById(this.config.containerId)
      if (!this.container) {
        console.error(`CouponWidget: Container #${this.config.containerId} not found`)
        return
      }

      injectStyles()
      this.render()

      // If API key endpoint is configured, fetch token first
      if (this.config.apiKeyEndpoint) {
        try {
          await this.fetchTokenFromApiKeyEndpoint()
        } catch (error) {
          // Error already handled in fetchTokenFromApiKeyEndpoint
          return
        }
      }

      this.loadData()
    }

    /**
     * Set widget session token from partner token
     * Called when partner provides token via window.sendCouponToken() or postMessage
     */
    async setPartnerToken(partnerToken) {
      try {
        const sessionData = await createWidgetSessionFromToken(partnerToken, this.instanceId)
        this.state.widgetSessionToken = sessionData.session_token
        
        // Reload data with new session token
        await this.loadData()
        
        return sessionData
      } catch (error) {
        console.error('CouponWidget: Error setting partner token:', error)
        this.setState({ 
          loading: false, 
          error: `Failed to authenticate: ${error.message}` 
        })
        throw error
      }
    }

    /**
     * Fetch widget session token from partner's backend (API Key Method)
     * Automatically called during initialization if apiKeyEndpoint is configured
     */
    async fetchTokenFromApiKeyEndpoint() {
      if (!this.config.apiKeyEndpoint) {
        return null
      }

      try {
        const sessionData = await fetchWidgetSessionFromApiKey(this.config.apiKeyEndpoint, this.instanceId)
        this.state.widgetSessionToken = sessionData.session_token
        
        console.log('CouponWidget: Successfully fetched widget session token via API key method')
        return sessionData
      } catch (error) {
        console.error('CouponWidget: Error fetching token from API key endpoint:', error)
        this.setState({ 
          loading: false, 
          error: `Failed to authenticate via API key: ${error.message}` 
        })
        throw error
      }
    }

    async loadData() {
      if (!this.config.vendorId) {
        this.setState({ loading: false, error: 'Vendor ID is required. Please configure the widget with a valid vendor ID.' })
        return
      }

      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      if (!uuidRegex.test(this.config.vendorId)) {
        // Check if it's a placeholder
        if (this.config.vendorId.includes('YOUR_VENDOR_ID') || this.config.vendorId.includes('VENDOR_ID')) {
          this.setState({ 
            loading: false, 
            error: 'Please replace YOUR_VENDOR_ID with an actual vendor ID from your dashboard. Go to Vendors page and copy a vendor ID.' 
          })
        } else {
          this.setState({ loading: false, error: 'Invalid vendor ID format. Vendor ID must be a valid UUID.' })
        }
        return
      }

      try {
        const data = await fetchCouponsData(
          this.config.vendorId, 
          this.config.userId,
          this.config.previewMode,
          0,
          this.state.widgetSessionToken
        )
        this.setState({
          loading: false,
          vendor: data.vendor,
          coupons: data.coupons || [],
          hasActiveClaim: data.has_active_claim || false,
          activeClaimExpiry: data.active_claim_expiry || null,
        })
      } catch (error) {
        console.error('Widget error:', error)
        // Provide more helpful error messages
        let errorMessage = 'Failed to load coupons. Please try again later.'
        
        if (error.message) {
          if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            errorMessage = 'Network error: Unable to connect to the server. Please check your internet connection and ensure the API URL is correct.'
          } else if (error.message.includes('CORS')) {
            errorMessage = 'CORS error: The server is not allowing requests from this domain. Please contact support.'
          } else if (error.message.includes('404') || error.message.includes('not found')) {
            errorMessage = 'Vendor not found. Please check that the vendor ID is correct.'
          } else if (error.message.includes('400') || error.message.includes('Invalid')) {
            errorMessage = `Invalid request: ${error.message}`
          } else {
            errorMessage = error.message
          }
        }
        
        this.setState({
          loading: false,
          error: errorMessage,
        })
      }
    }

    async handleGenerateCode(couponId) {
      if (!checkRateLimit(`${this.instanceId}-${couponId}`)) {
        this.showError(couponId, 'Please wait before trying again')
        return
      }

      // Set loading state for this coupon
      const button = document.querySelector(`[data-coupon-id="${couponId}"]`)
      if (button) {
        button.disabled = true
        button.classList.add('loading')
        button.textContent = ''
      }

      try {
        // Determine which user ID to use - try multiple methods
        let userIdToUse = this.config.userId
        
        // Method 1: Try auto-detection (WordPress globals, meta tags, etc.)
        if (!userIdToUse) {
          userIdToUse = detectUserId()
          if (userIdToUse) {
            this.config.userId = userIdToUse
            console.log('CouponWidget: Using auto-detected user ID:', userIdToUse)
          }
        }
        
        // Method 2: Try WordPress REST API fetch (async)
        if (!userIdToUse) {
          try {
            const wpUserId = await fetchWordPressUserIdSync()
            if (wpUserId) {
              userIdToUse = wpUserId
              this.config.userId = userIdToUse
              console.log('CouponWidget: Fetched WordPress user ID from REST API:', userIdToUse)
            }
          } catch (e) {
            console.debug('CouponWidget: WordPress REST API fetch failed:', e)
          }
        }
        
        // Method 3: Fallback to anonymous ID (per-browser, not ideal)
        if (!userIdToUse) {
          userIdToUse = this.getOrCreateAnonymousUserId()
          console.warn('CouponWidget: No user ID detected, using anonymous ID:', userIdToUse)
          console.warn('CouponWidget: ⚠️ Anonymous IDs are per-browser. Same user in different browsers = different IDs')
          console.warn('CouponWidget: 💡 To fix: Add WordPress helper code to functions.php (see WORDPRESS_AUTO_USER_ID.md)')
        }
        
        console.log('CouponWidget: Attempting to claim coupon with user ID:', userIdToUse)
        
        const claimedCoupon = await claimCoupon(
          couponId, 
          userIdToUse,
          this.config.previewMode,
          0,
          this.state.widgetSessionToken
        )
        
        // Store claimed coupon
        this.state.claimedCoupons.set(couponId, claimedCoupon)
        this.state.errors.delete(couponId)
        
        // Update UI
        this.updateCouponCard(couponId, claimedCoupon)
      } catch (error) {
        console.error('Claim error:', error)
        this.showError(couponId, error.message || 'Failed to generate code. Please try again.')
        
        // Reset button
        if (button) {
          button.disabled = false
          button.classList.remove('loading')
          button.textContent = 'Generate Code'
        }
      }
    }

    showError(couponId, message) {
      this.state.errors.set(couponId, message)
      this.updateCouponCard(couponId)
    }

    updateCouponCard(couponId, claimedCoupon = null) {
      const card = document.querySelector(`[data-coupon-card-id="${couponId}"]`)
      if (!card) return

      const codeDisplay = card.querySelector('.coupon-widget-code-display')
      const codeValue = card.querySelector('.coupon-widget-code-value')
      const button = card.querySelector('[data-coupon-id]')
      const copyButton = card.querySelector('.coupon-widget-copy-button')
      const errorDiv = card.querySelector('.coupon-widget-error')

      // Clear error
      if (errorDiv) {
        errorDiv.remove()
      }

      if (claimedCoupon) {
        // Show code
        if (codeDisplay) {
          codeDisplay.classList.add('show')
        }
        if (codeValue) {
          codeValue.textContent = claimedCoupon.code
        }
        if (button) {
          button.style.display = 'none'
        }
        if (copyButton) {
          copyButton.classList.add('show')
          copyButton.textContent = 'Copy Code'
        }
      } else {
        // Show error if any
        const error = this.state.errors.get(couponId)
        if (error && card) {
          const errorEl = document.createElement('div')
          errorEl.className = 'coupon-widget-error'
          errorEl.textContent = error
          if (button) {
            button.parentNode.insertBefore(errorEl, button)
          }
        }
      }
    }

    copyCode(couponId) {
      const claimedCoupon = this.state.claimedCoupons.get(couponId)
      if (!claimedCoupon) return

      const code = claimedCoupon.code
      const copyButton = document.querySelector(`[data-copy-coupon-id="${couponId}"]`)

      if (navigator.clipboard) {
        navigator.clipboard.writeText(code).then(() => {
          if (copyButton) {
            copyButton.textContent = '✓ Copied!'
            copyButton.classList.add('copied')
            setTimeout(() => {
              copyButton.textContent = 'Copy Code'
              copyButton.classList.remove('copied')
            }, 2000)
          }
        }).catch(() => {
          // Fallback
          this.fallbackCopy(code, copyButton)
        })
      } else {
        this.fallbackCopy(code, copyButton)
      }
    }

    fallbackCopy(text, button) {
      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      
      if (button) {
        button.textContent = '✓ Copied!'
        button.classList.add('copied')
        setTimeout(() => {
          button.textContent = 'Copy Code'
          button.classList.remove('copied')
        }, 2000)
      }
    }

    setState(newState) {
      this.state = { ...this.state, ...newState }
      this.render()
    }

    render() {
      if (!this.container) return

      const { loading, vendor, coupons, error, hasActiveClaim, activeClaimExpiry } = this.state

      if (loading) {
        this.container.innerHTML = '<div class="coupon-widget-empty"><div class="coupon-widget-empty-icon">⏳</div><p>Loading coupons...</p></div>'
        return
      }

      if (error) {
        this.container.innerHTML = `<div class="coupon-widget-error">${this.escapeHtml(error)}</div>`
        return
      }

      if (!vendor || coupons.length === 0) {
        this.container.innerHTML = '<div class="coupon-widget-empty"><div class="coupon-widget-empty-icon">📭</div><p>No coupons available at this time.</p></div>'
        return
      }

      // Show active claim message if user has one
      let activeClaimMessage = ''
      if (hasActiveClaim && activeClaimExpiry) {
        const expiryDate = new Date(activeClaimExpiry)
        const daysLeft = Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60 * 24))
        activeClaimMessage = `<div class="coupon-widget-info" style="background: #1e3a8a; color: #dbeafe; padding: 12px; border-radius: 8px; margin-bottom: 16px; text-align: center;">
          <strong>You have an active coupon!</strong> It expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}. Other coupons are disabled until it expires.
        </div>`
      }

      let html = activeClaimMessage + '<div class="coupon-widget-grid">'

      coupons.forEach((coupon) => {
        const claimedCoupon = this.state.claimedCoupons.get(coupon.id)
        const error = this.state.errors.get(coupon.id)
        const offerText = coupon.discount_value || 'Special Offer'
        
        // Check if this coupon is the active claim or if user has an active claim for another coupon
        const isActiveClaim = hasActiveClaim && coupon.is_claimed && claimedCoupon
        const isDisabled = hasActiveClaim && !isActiveClaim && !claimedCoupon
        
        html += `
          <div class="coupon-widget-card ${isDisabled ? 'opacity-60' : ''}" data-coupon-card-id="${coupon.id}" style="${isDisabled ? 'pointer-events: none;' : ''}">
            ${vendor.logo_url ? `<img src="${this.escapeHtml(vendor.logo_url)}" alt="${this.escapeHtml(vendor.name)}" class="coupon-widget-card-image" onerror="this.style.display='none'">` : '<div class="coupon-widget-card-image"></div>'}
            <div class="coupon-widget-card-content">
              <div class="coupon-widget-card-brand">${this.escapeHtml(vendor.name)}</div>
              <div class="coupon-widget-card-offer">${this.escapeHtml(offerText)}</div>
              ${vendor.description ? `<div class="coupon-widget-card-description">${this.escapeHtml(vendor.description)}</div>` : ''}
              <div class="coupon-widget-code-section">
                ${error ? `<div class="coupon-widget-error">${this.escapeHtml(error)}</div>` : ''}
                ${isDisabled ? '<div class="coupon-widget-error" style="background: #7c2d12; border-color: #991b1b; color: #fca5a5;">You already have an active coupon. Please wait until it expires.</div>' : ''}
                <div class="coupon-widget-code-display ${claimedCoupon || isActiveClaim ? 'show' : ''}">
                  <div class="coupon-widget-code-label">Your Coupon Code</div>
                  <div class="coupon-widget-code-value">${claimedCoupon ? this.escapeHtml(claimedCoupon.code) : (isActiveClaim && coupon.code ? this.escapeHtml(coupon.code) : '')}</div>
                </div>
                <button 
                  class="coupon-widget-button" 
                  data-coupon-id="${coupon.id}"
                  data-instance-id="${this.config.containerId}"
                  ${claimedCoupon || isActiveClaim || isDisabled ? 'style="display:none"' : ''}
                  ${isDisabled ? 'disabled' : ''}
                  onclick="CouponWidget.handleGenerateCode('${this.config.containerId}', '${coupon.id}')">
                  ${claimedCoupon || isActiveClaim ? '' : 'Generate Code'}
                </button>
                <button 
                  class="coupon-widget-copy-button ${claimedCoupon || isActiveClaim ? 'show' : ''}"
                  data-copy-coupon-id="${coupon.id}"
                  data-instance-id="${this.config.containerId}"
                  onclick="CouponWidget.copyCode('${this.config.containerId}', '${coupon.id}')">
                  Copy Code
                </button>
                ${vendor.website ? `<a href="${this.escapeHtml(vendor.website)}" target="_blank" rel="noopener noreferrer" class="coupon-widget-link">VISIT WEBSITE</a>` : ''}
              </div>
            </div>
          </div>
        `
      })

      html += '</div>'
      this.container.innerHTML = html
    }

    escapeHtml(str) {
      if (!str) return ''
      const div = document.createElement('div')
      div.textContent = str
      return div.innerHTML
    }
  }

  /**
   * Automatically detect user ID from various CMS platforms
   * Supports: WordPress, WooCommerce, custom implementations
   */
  function detectUserId() {
    // Priority 1: Check for custom user ID in global variable (set by WordPress helper code)
    // This is the most reliable method and doesn't require REST API
    if (typeof window.COUPON_WIDGET_USER_ID !== 'undefined') {
      if (window.COUPON_WIDGET_USER_ID) {
        console.log('CouponWidget: ✅ Detected WordPress user ID from helper code:', window.COUPON_WIDGET_USER_ID)
        return String(window.COUPON_WIDGET_USER_ID)
      } else {
        // Helper code exists but user is not logged in
        console.log('CouponWidget: ℹ️ Helper code detected but user is not logged in (COUPON_WIDGET_USER_ID is empty)')
      }
    } else {
      // Helper code not detected - show helpful message
      console.warn('CouponWidget: ⚠️ WordPress helper code not detected!')
      console.warn('CouponWidget: 💡 Add this to your theme\'s functions.php:')
      console.warn('CouponWidget: function expose_user_id_to_coupon_widget() {')
      console.warn('CouponWidget:   if (is_user_logged_in()) {')
      console.warn('CouponWidget:     $user_id = get_current_user_id();')
      console.warn('CouponWidget:     echo "<script>window.COUPON_WIDGET_USER_ID = \'".$user_id."\';</script>";')
      console.warn('CouponWidget:   }')
      console.warn('CouponWidget: }')
      console.warn('CouponWidget: add_action(\'wp_footer\', \'expose_user_id_to_coupon_widget\');')
    }

    // Priority 2: Check for user ID in data attribute on body or html (set by helper code)
    const bodyUserId = document.body?.getAttribute('data-user-id') || document.documentElement?.getAttribute('data-user-id')
    if (bodyUserId) {
      console.log('CouponWidget: ✅ Detected WordPress user ID from data attribute:', bodyUserId)
      return bodyUserId
    }

    // Priority 3: Check for WordPress user data in meta tags (set by helper code)
    const wpUserIdMeta = document.querySelector('meta[name="wp-user-id"]')
    if (wpUserIdMeta && wpUserIdMeta.content) {
      console.log('CouponWidget: ✅ Detected WordPress user ID from meta tag:', wpUserIdMeta.content)
      return wpUserIdMeta.content
    }

    // Priority 4: Check WordPress global variables (if available)
    if (typeof window.wpApiSettings !== 'undefined' && window.wpApiSettings.currentUser) {
      const wpUser = window.wpApiSettings.currentUser
      if (wpUser.id) {
        console.log('CouponWidget: ✅ Detected WordPress user ID from wpApiSettings:', wpUser.id)
        return String(wpUser.id)
      }
    }

    // Priority 5: Check WordPress REST API user object
    if (typeof window.wp !== 'undefined' && window.wp.api && window.wp.api.models) {
      try {
        const currentUser = window.wp.api.models.User.currentUser
        if (currentUser && currentUser.id) {
          console.log('CouponWidget: ✅ Detected WordPress REST API user ID:', currentUser.id)
          return String(currentUser.id)
        }
      } catch (e) {
        // Ignore errors
      }
    }

    // Priority 6: Check for WooCommerce user data
    if (typeof window.wc_add_to_cart_params !== 'undefined' && window.wc_add_to_cart_params.current_user_id) {
      console.log('CouponWidget: ✅ Detected WooCommerce user ID:', window.wc_add_to_cart_params.current_user_id)
      return String(window.wc_add_to_cart_params.current_user_id)
    }

    // 7. Try to fetch from WordPress REST API synchronously (if possible)
    // Note: This is a best-effort attempt, full async fetch happens later
    try {
      if (typeof window.wpApiSettings !== 'undefined' && window.wpApiSettings.root) {
        // We'll try async fetch, but for now return null
        // The async fetch will update the widget later
      }
    } catch (e) {
      // Ignore
    }

    // 8. For anonymous users, generate and store a unique ID
    // This ensures each user gets a consistent ID across page loads
    // Different users on the same browser will get different IDs
    try {
      const storageKey = 'coupon_widget_anonymous_id'
      
      // Try localStorage first (persists across sessions)
      let anonymousId = localStorage.getItem(storageKey)
      
      if (!anonymousId) {
        // Generate a new unique anonymous ID
        const timestamp = Date.now()
        const random = Math.random().toString(36).substring(2, 15)
        const random2 = Math.random().toString(36).substring(2, 15)
        anonymousId = `anon_${timestamp}_${random}${random2}`
        
        // Store in localStorage for consistency
        localStorage.setItem(storageKey, anonymousId)
        
        console.log('CouponWidget: Generated and stored new anonymous ID:', anonymousId)
      } else {
        console.log('CouponWidget: Reusing stored anonymous ID:', anonymousId)
      }
      
      return anonymousId
    } catch (e) {
      // If localStorage is not available (private browsing, etc.), generate a temporary ID
      console.warn('CouponWidget: localStorage not available, using session-only anonymous ID')
      return `anon_temp_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
    }
  }

  /**
   * Try to fetch user ID from WordPress REST API
   * This is called as a last resort - helper code in functions.php is preferred
   * Note: This often returns 401 if REST API authentication isn't configured
   */
  async function fetchWordPressUserIdSync() {
    // Skip REST API fetch if helper code should have set the user ID
    // This prevents unnecessary 401 errors
    if (typeof window.COUPON_WIDGET_USER_ID !== 'undefined') {
      return null // Helper code should have set it, but it's empty/undefined
    }
    
    try {
      // Try multiple WordPress REST API endpoints
      const endpoints = []
      
      // Method 1: Use wpApiSettings if available
      if (typeof window.wpApiSettings !== 'undefined' && window.wpApiSettings.root) {
        endpoints.push(window.wpApiSettings.root + 'wp/v2/users/me')
      }
      
      // Method 2: Try common WordPress REST API paths
      const currentOrigin = window.location.origin
      endpoints.push(
        currentOrigin + '/wp-json/wp/v2/users/me',
        currentOrigin + '/?rest_route=/wp/v2/users/me'
      )
      
      // Try each endpoint
      for (const apiUrl of endpoints) {
        try {
          const response = await fetch(apiUrl, {
            credentials: 'include', // Include cookies for authentication
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          })

          if (response.ok) {
            const user = await response.json()
            if (user.id) {
              console.log('CouponWidget: ✅ Fetched WordPress user ID from REST API:', user.id)
              return String(user.id)
            }
          } else if (response.status === 401) {
            // 401 is expected if REST API auth isn't configured - don't log as error
            console.debug('CouponWidget: WordPress REST API requires authentication (401). Use helper code in functions.php instead.')
            break // Don't try other endpoints if auth is required
          }
        } catch (e) {
          // Continue to next endpoint
          continue
        }
      }
    } catch (error) {
      // Silently fail - REST API is optional
      console.debug('CouponWidget: Could not fetch WordPress user ID from REST API:', error)
    }
    return null
  }

  /**
   * Try to fetch user ID from WordPress REST API (async version)
   * This is called asynchronously and updates the widget if user is found
   */
  async function fetchWordPressUserId() {
    return await fetchWordPressUserIdSync()
  }

  const CouponWidget = {
    initFromAttributes() {
      // Find all potential widget containers
      const containers = document.querySelectorAll(
        '[id^="coupon-widget"], [data-coupon-widget], [data-vendor-id]'
      )

      if (containers.length === 0) {
        console.log('CouponWidget: No containers found. Make sure you have a div with data-vendor-id attribute.')
        return
      }

      console.log(`CouponWidget: Found ${containers.length} potential container(s)`)

      // Try to auto-detect user ID once for all containers
      let autoDetectedUserId = detectUserId()
      
      // If not found, try async WordPress REST API fetch
      if (!autoDetectedUserId) {
        fetchWordPressUserIdSync().then((wpUserId) => {
          if (wpUserId) {
            console.log('CouponWidget: Fetched WordPress user ID asynchronously:', wpUserId)
            // Update all instances with the detected user ID
            containers.forEach((container) => {
              const containerId = container.id || container.getAttribute('id')
              const instance = widgetState.instances.get(containerId)
              if (instance && instance.config) {
                instance.config.userId = wpUserId
                console.log('CouponWidget: Updated instance with WordPress user ID')
              }
            })
          }
        })
      }

      containers.forEach((container) => {
        // Skip if already initialized
        if (container.dataset.widgetInitialized === 'true') {
          return
        }

        const vendorId = container.getAttribute('data-vendor-id') || container.getAttribute('data-vendor')
        // Use data attribute if provided, otherwise try auto-detection
        let userId = container.getAttribute('data-user-id') || autoDetectedUserId
        const theme = container.getAttribute('data-theme') || 'light'
        const apiKeyEndpoint = container.getAttribute('data-api-key-endpoint') || null
        const containerId = container.id || `coupon-widget-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`

        if (!vendorId) {
          // Skip containers without vendor-id (might be other elements)
          return
        }

        // Validate vendor ID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        if (!uuidRegex.test(vendorId)) {
          console.warn('CouponWidget: Invalid vendor ID format:', vendorId)
          return
        }

        if (!container.id) {
          container.id = containerId
        }

        // Mark as initialized to prevent duplicate initialization
        container.dataset.widgetInitialized = 'true'

        const instance = new CouponWidgetInstance({
          vendorId,
          userId: userId || undefined, // Will use anonymous ID if not provided
          theme,
          containerId,
          apiKeyEndpoint: apiKeyEndpoint || undefined, // API Key method endpoint
        })

        widgetState.instances.set(containerId, instance)
        console.log(`CouponWidget: Initializing widget for container ${containerId}${userId ? ` with user ID: ${userId}` : ' (will use anonymous ID)'}`)
        instance.init()

        // Try to fetch WordPress user ID asynchronously and update if found
        if (!userId) {
          fetchWordPressUserId().then((wpUserId) => {
            if (wpUserId && instance.config) {
              instance.config.userId = wpUserId
              console.log('CouponWidget: Updated widget with WordPress user ID:', wpUserId)
            }
          })
        }
      })
    },

    init(config) {
      if (!config.vendorId) {
        console.error('CouponWidget: vendorId is required')
        return
      }

      // Auto-detect user ID if not provided
      if (!config.userId) {
        const autoDetectedUserId = detectUserId()
        if (autoDetectedUserId) {
          config.userId = autoDetectedUserId
          console.log('CouponWidget: Auto-detected user ID:', autoDetectedUserId)
        }
      }

      const containerId = config.containerId || 'coupon-widget'
      let container = document.getElementById(containerId)

      if (!container) {
        container = document.createElement('div')
        container.id = containerId
        document.body.appendChild(container)
      }

      const instance = new CouponWidgetInstance(config)
      
      // Try to fetch WordPress user ID asynchronously and update if found
      if (!config.userId) {
        fetchWordPressUserId().then((wpUserId) => {
          if (wpUserId && instance.config) {
            instance.config.userId = wpUserId
            console.log('CouponWidget: Updated widget with WordPress user ID:', wpUserId)
          }
        })
      }
      widgetState.instances.set(containerId, instance)
      instance.init()

      return instance
    },

    handleGenerateCode(containerId, couponId) {
      const instance = widgetState.instances.get(containerId)
      if (instance) {
        instance.handleGenerateCode(couponId)
      } else {
        console.error('CouponWidget: Instance not found for container', containerId)
      }
    },

    copyCode(containerId, couponId) {
      const instance = widgetState.instances.get(containerId)
      if (instance) {
        instance.copyCode(couponId)
      } else {
        console.error('CouponWidget: Instance not found for container', containerId)
      }
    },
  }

  window.CouponWidget = CouponWidget

  // Initialize function that can be called multiple times
  function initializeWidget() {
    try {
      CouponWidget.initFromAttributes()
    } catch (error) {
      console.error('CouponWidget: Initialization error:', error)
    }
  }

  // Initialize immediately if DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeWidget)
  } else {
    // DOM already ready, initialize immediately
    initializeWidget()
  }

  // Also initialize after delays (for WordPress/Elementor dynamic content)
  setTimeout(initializeWidget, 100)
  setTimeout(initializeWidget, 500)
  setTimeout(initializeWidget, 1000)
  setTimeout(initializeWidget, 2000)
  setTimeout(initializeWidget, 3000)

  // Support for MutationObserver to detect dynamically added containers (WordPress/Elementor)
  if (typeof MutationObserver !== 'undefined') {
    let reinitTimeout = null
    
    const observer = new MutationObserver((mutations) => {
      let shouldReinit = false
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) { // Element node
            // Check if added node or its children contain widget containers
            if (node.id && (node.id.includes('coupon-widget') || node.hasAttribute('data-vendor-id'))) {
              shouldReinit = true
            } else if (node.querySelectorAll && (
              node.querySelectorAll('[id*="coupon-widget"]').length > 0 ||
              node.querySelectorAll('[data-vendor-id]').length > 0
            )) {
              shouldReinit = true
            }
          }
        })
      })
      if (shouldReinit) {
        // Debounce reinit calls
        if (reinitTimeout) {
          clearTimeout(reinitTimeout)
        }
        reinitTimeout = setTimeout(initializeWidget, 200)
      }
    })

    // Start observing when body is available
    if (document.body) {
      observer.observe(document.body, {
        childList: true,
        subtree: true,
      })
    } else {
      // Wait for body if not available yet
      document.addEventListener('DOMContentLoaded', () => {
        if (document.body) {
          observer.observe(document.body, {
            childList: true,
            subtree: true,
          })
        }
      })
    }
  }

  // Expose reinit function for manual initialization (useful for WordPress/Elementor)
  window.CouponWidgetReinit = initializeWidget

  /**
   * Global function for partners to send coupon token
   * Usage: window.sendCouponToken(token)
   */
  window.sendCouponToken = function(partnerToken) {
    if (!partnerToken) {
      console.error('CouponWidget: Partner token is required')
      return
    }

    // Find all widget instances and set the token
    widgetState.instances.forEach((instance) => {
      instance.setPartnerToken(partnerToken).catch((error) => {
        console.error('CouponWidget: Error setting partner token on instance:', error)
      })
    })
  }

  // Listen for postMessage from parent window (for iframe embedding)
  window.addEventListener('message', function(event) {
    // Security: validate origin if needed
    // if (event.origin !== 'https://trusted-partner.com') return;

    if (event.data && event.data.type === 'COUPON_TOKEN' && event.data.token) {
      window.sendCouponToken(event.data.token)
    }
  })
  
  // Also expose on window load (for very late loading)
  window.addEventListener('load', () => {
    setTimeout(initializeWidget, 500)
  })
})(window, document)
