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
  
  // IMMEDIATE LOG - This should appear as soon as script loads
  console.log('[CouponWidget] ============================================');
  console.log('[CouponWidget] Script file loaded and executing');
  console.log('[CouponWidget] Timestamp:', new Date().toISOString());
  console.log('[CouponWidget] ============================================');

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

      // Authentication is handled server-side by the WordPress plugin
      // We just call the endpoint - the plugin authenticates via WordPress cookies
      const url = apiKeyEndpoint

      // Get REST API nonce from WordPress (exposed via wp_localize_script)
      const restNonce = typeof couponDispenserWidget !== 'undefined' && couponDispenserWidget.restNonce
        ? couponDispenserWidget.restNonce
        : null

      // Build headers with nonce for WordPress REST API authentication
      const headers = {
        'Content-Type': 'application/json',
      }
      
      // Add WordPress REST API nonce header if available
      if (restNonce) {
        headers['X-WP-Nonce'] = restNonce
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: headers,
        credentials: 'include', // Include cookies for WordPress authentication
        mode: 'cors',
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        
        // If we get 401, it means user is not logged in
        if (response.status === 401) {
          const errorMessage = errorData.error || errorData.message || 'You must be logged in to view and claim coupons. Please log in to your account.'
          throw new Error(errorMessage)
        }
        
        throw new Error(errorData.error || errorData.message || `HTTP ${response.status}: ${response.statusText}`)
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
        return fetchCouponsData(vendorId, userId, previewMode, retries + 1, widgetSessionToken)
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
        return claimCoupon(couponId, userId, previewMode, retries + 1, widgetSessionToken)
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
          // Only load data if token fetch succeeded
          this.loadData()
        } catch (error) {
          // Error already handled in fetchTokenFromApiKeyEndpoint
          // The error state is set, so render() will display it
          // Don't return - let the widget render the error message
          console.error('CouponWidget: Failed to initialize - authentication error')
        }
      } else {
        // No API key endpoint - load data directly (legacy mode)
        this.loadData()
      }
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
        // User ID is managed by the widget session token from the plugin endpoint
        // The plugin authenticates the user server-side and includes user_id in the session token
        // We don't need to detect or pass user ID here
        // Removed all WordPress user detection - authentication handled by plugin
        console.log('CouponWidget: Attempting to claim coupon')
        
        const claimedCoupon = await claimCoupon(
          couponId, 
          null, // User ID is in the session token
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

        // Show error to user
        this.state.errors.set(couponId, error.message || 'Failed to claim coupon')
        this.updateCouponCard(couponId, null)

        // Reset button state
        if (button) {
          button.disabled = false
          button.classList.remove('loading')
          button.textContent = 'Get Code'
        }
      }
    }
  }

  // Global CouponWidget object
  const CouponWidget = {
    initFromAttributes() {
      const containers = document.querySelectorAll('[data-vendor-id]')
      containers.forEach((container) => {
        if (container.dataset.widgetInitialized === 'true') return

        const vendorId = container.getAttribute('data-vendor-id')
        const theme = container.getAttribute('data-theme') || 'light'
        const apiKeyEndpoint = container.getAttribute('data-api-key-endpoint') || null
        const containerId = container.id || 'coupon-widget-' + Math.random().toString(36).slice(2)

        if (!container.id) {
          container.id = containerId
        }

        container.dataset.widgetInitialized = 'true'

        const instance = new CouponWidgetInstance({
          vendorId,
          theme,
          containerId,
          apiKeyEndpoint,
        })

        widgetState.instances.set(containerId, instance)
        instance.init()
      })
    },

    init(config) {
      if (!config.vendorId) {
        console.error('CouponWidget: vendorId is required')
        return
      }

      // User ID is handled server-side by the plugin - we don't detect it client-side
      const containerId = config.containerId || 'coupon-widget'
      let container = document.getElementById(containerId)

      if (!container) {
        container = document.createElement('div')
        container.id = containerId
        document.body.appendChild(container)
      }

      const instance = new CouponWidgetInstance(config)
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

  // Expose CouponWidget to window
  window.CouponWidget = CouponWidget
  console.log('[CouponWidget] Script loaded - Version: 1.1.0')
  console.log('[CouponWidget] CouponWidget object exposed to window:', typeof window.CouponWidget)

  // Initialize function that can be called multiple times
  function initializeWidget() {
    console.log('[CouponWidget] initializeWidget() called')
    try {
      CouponWidget.initFromAttributes()
    } catch (error) {
      console.error('[CouponWidget] Initialization error:', error)
      console.error('[CouponWidget] Error stack:', error.stack)
    }
  }

  // Simple initialization - no Elementor checks needed
  function startInitialization() {
    console.log('[CouponWidget] startInitialization() called')
    console.log('[CouponWidget] Document ready state:', document.readyState)
    console.log('[CouponWidget] API URL configured:', window.COUPON_WIDGET_API_URL || 'NOT SET')
    
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      console.log('[CouponWidget] DOM is loading, waiting for DOMContentLoaded')
      document.addEventListener('DOMContentLoaded', function() {
        console.log('[CouponWidget] DOMContentLoaded fired, initializing in 100ms')
        setTimeout(initializeWidget, 100)
      })
    } else {
      // DOM is already ready
      console.log('[CouponWidget] DOM already ready, initializing in 100ms')
      setTimeout(initializeWidget, 100)
    }

    // Also initialize after window load to catch dynamically added containers
    if (document.readyState !== 'complete') {
      console.log('[CouponWidget] Window not loaded, waiting for load event')
      window.addEventListener('load', function() {
        console.log('[CouponWidget] Window load fired, initializing in 200ms')
        setTimeout(initializeWidget, 200)
      })
    } else {
      // Already loaded, initialize after a short delay
      console.log('[CouponWidget] Window already loaded, initializing in 200ms')
      setTimeout(initializeWidget, 200)
    }

    // Initialize again after delays for dynamic content (WordPress/Elementor shortcodes)
    console.log('[CouponWidget] Scheduling delayed initializations at 1s and 3s')
    setTimeout(function() {
      console.log('[CouponWidget] Delayed initialization (1s)')
      initializeWidget()
    }, 1000)
    setTimeout(function() {
      console.log('[CouponWidget] Delayed initialization (3s)')
      initializeWidget()
    }, 3000)
  }

  // Start initialization
  console.log('[CouponWidget] Starting initialization process')
  startInitialization()

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
