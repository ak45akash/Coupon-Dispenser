/**
 * Coupon Dispenser Embeddable Widget
 * Version: 1.1.0
 * Build Date: 2024-12-19
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
        width: 100% !important;
        max-width: 100% !important;
        margin: 0 !important;
        padding: 24px;
        box-sizing: border-box;
      }
      /* Override any inline styles from shortcode */
      div.coupon-widget-container,
      div#coupon-widget.coupon-widget-container,
      div.coupon-dispenser-widget-container,
      div#coupon-widget.coupon-dispenser-widget-container {
        width: 100% !important;
        max-width: 100% !important;
        margin: 0 !important;
        border: none !important;
        padding: 24px !important;
        box-sizing: border-box !important;
      }
      .coupon-widget-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 20px;
        margin-top: 20px;
      }
      .coupon-widget-card {
        position: relative;
        background: #ffffff;
        border: 1px solid #e5e7eb;
        border-radius: 12px;
        overflow: hidden;
        min-height: 380px;
        display: flex;
        flex-direction: column;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
        transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
      }
      .coupon-widget-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06);
        border-color: #d1d5db;
      }
      .coupon-widget-card-image {
        width: 100%;
        height: 180px;
        object-fit: cover;
        background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
      }
      .coupon-widget-card-content {
        padding: 20px;
        flex: 1;
        display: flex;
        flex-direction: column;
        color: #1f2937;
      }
      .coupon-widget-card-brand {
        font-size: 20px;
        font-weight: 700;
        margin-bottom: 8px;
        color: #111827;
      }
      .coupon-widget-card-offer {
        font-size: 16px;
        font-weight: 600;
        color: #374151;
        margin-bottom: 12px;
      }
      .coupon-widget-card-description {
        font-size: 14px;
        color: #6b7280;
        line-height: 1.6;
        margin-bottom: 20px;
        flex: 1;
      }
      .coupon-widget-code-section {
        margin-top: auto;
        padding-top: 16px;
        border-top: 1px solid #e5e7eb;
      }
      .coupon-widget-code-display {
        display: none;
        background: #f9fafb;
        border: 2px dashed #d1d5db;
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
        font-size: 22px;
        font-weight: 700;
        color: #2563eb;
        letter-spacing: 2px;
        margin: 8px 0;
        font-family: 'Monaco', 'Courier New', monospace;
      }
      .coupon-widget-code-label {
        font-size: 12px;
        color: #6b7280;
        text-transform: uppercase;
        letter-spacing: 1px;
      }
      .coupon-widget-button {
        width: 100%;
        padding: 12px 20px;
        font-size: 15px;
        font-weight: 600;
        color: #ffffff;
        background: #2563eb;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s ease;
        margin-bottom: 12px;
      }
      .coupon-widget-button:hover:not(:disabled) {
        background: #1d4ed8;
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
        color: #374151;
        background: #f9fafb;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s ease;
        display: none;
      }
      .coupon-widget-copy-button.show {
        display: block;
      }
      .coupon-widget-copy-button:hover {
        background: #f3f4f6;
        border-color: #d1d5db;
      }
      .coupon-widget-copy-button.copied {
        background: #10b981;
        border-color: #10b981;
        color: #ffffff;
      }
      .coupon-widget-link {
        display: block;
        text-align: center;
        color: #6b7280;
        font-size: 12px;
        text-decoration: none;
        margin-top: 8px;
        transition: color 0.2s ease;
      }
      .coupon-widget-link:hover {
        color: #2563eb;
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
        color: #6b7280;
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
      /* Large desktop: 4 columns (default) */
      /* Medium-large desktop: 3 columns */
      @media (max-width: 1400px) and (min-width: 1025px) {
        .coupon-widget-grid {
          grid-template-columns: repeat(3, 1fr);
        }
      }
      /* Tablet: 2 columns */
      @media (max-width: 1024px) and (min-width: 769px) {
        .coupon-widget-grid {
          grid-template-columns: repeat(2, 1fr);
        }
      }
      /* Mobile: 1 column */
      @media (max-width: 768px) {
        .coupon-widget-grid {
          grid-template-columns: 1fr;
          gap: 16px;
        }
        .coupon-widget-container {
          padding: 16px;
        }
      }
      /* Small mobile: 1 column with reduced padding */
      @media (max-width: 480px) {
        .coupon-widget-container {
          padding: 12px;
        }
        .coupon-widget-grid {
          gap: 12px;
        }
        .coupon-widget-card {
          min-height: 350px;
        }
        .coupon-widget-card-content {
          padding: 16px;
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
