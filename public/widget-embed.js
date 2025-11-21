/**
 * Coupon Dispenser Embeddable Widget
 * 
 * A lightweight, secure, embeddable widget for partner websites
 * 
 * Usage:
 * <script src="https://your-domain.com/widget-embed.js"></script>
 * <div id="coupon-widget" 
 *      data-vendor-id="VENDOR_ID" 
 *      data-user-id="USER_ID" 
 *      data-campaign-id="CAMPAIGN_ID"
 *      data-theme="light"
 *      data-container-id="custom-container">
 * </div>
 * 
 * Or via JavaScript:
 * CouponWidget.init({
 *   vendorId: 'VENDOR_ID',
 *   userId: 'USER_ID',
 *   campaignId: 'CAMPAIGN_ID',
 *   theme: 'light',
 *   containerId: 'coupon-widget'
 * });
 */

(function (window, document) {
  'use strict'

  // Configuration
  const CONFIG = {
    API_BASE_URL: window.location.origin || 'https://your-domain.com',
    RATE_LIMIT_MS: 2000, // Minimum time between clicks (2 seconds)
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000,
  }

  // Widget state
  const widgetState = {
    instances: new Map(),
    rateLimitTimers: new Map(),
    antiSpamTokens: new Map(),
  }

  /**
   * Generate anti-spam token
   */
  function generateAntiSpamToken() {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 15)
    return btoa(`${timestamp}-${random}`).substring(0, 16)
  }

  /**
   * Rate limiting check
   */
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

  /**
   * Sanitize HTML to prevent XSS
   */
  function sanitizeHTML(str) {
    const div = document.createElement('div')
    div.textContent = str
    return div.innerHTML
  }

  /**
   * Create widget styles
   */
  function createStyles(theme) {
    const isDark = theme === 'dark'
    const bgColor = isDark ? '#1a1a1a' : '#ffffff'
    const textColor = isDark ? '#ffffff' : '#1a1a1a'
    const primaryColor = isDark ? '#60a5fa' : '#3b82f6'
    const borderColor = isDark ? '#333333' : '#e5e7eb'

    return `
      .coupon-widget-container {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        max-width: 400px;
        margin: 0 auto;
        background: ${bgColor};
        border: 1px solid ${borderColor};
        border-radius: 12px;
        padding: 24px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        transition: all 0.3s ease;
      }
      .coupon-widget-container.dark {
        background: ${bgColor};
        color: ${textColor};
      }
      .coupon-widget-header {
        text-align: center;
        margin-bottom: 20px;
      }
      .coupon-widget-title {
        font-size: 24px;
        font-weight: 700;
        color: ${textColor};
        margin: 0 0 8px 0;
      }
      .coupon-widget-description {
        font-size: 14px;
        color: ${isDark ? '#a0a0a0' : '#6b7280'};
        margin: 0;
      }
      .coupon-widget-button {
        width: 100%;
        padding: 14px 24px;
        font-size: 16px;
        font-weight: 600;
        color: #ffffff;
        background: ${primaryColor};
        border: none;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s ease;
        margin-top: 16px;
      }
      .coupon-widget-button:hover:not(:disabled) {
        background: ${isDark ? '#4f9ff0' : '#2563eb'};
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
      }
      .coupon-widget-button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
      .coupon-widget-button:active:not(:disabled) {
        transform: translateY(0);
      }
      .coupon-widget-loading {
        display: inline-block;
        width: 16px;
        height: 16px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-top-color: #ffffff;
        border-radius: 50%;
        animation: spin 0.6s linear infinite;
        margin-right: 8px;
        vertical-align: middle;
      }
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
      .coupon-widget-success {
        text-align: center;
        animation: fadeIn 0.3s ease;
      }
      .coupon-widget-success-icon {
        width: 64px;
        height: 64px;
        margin: 0 auto 16px;
        background: #10b981;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 32px;
      }
      .coupon-widget-code {
        background: ${isDark ? '#2a2a2a' : '#f3f4f6'};
        border: 2px dashed ${borderColor};
        border-radius: 8px;
        padding: 16px;
        margin: 16px 0;
        text-align: center;
      }
      .coupon-widget-code-value {
        font-size: 28px;
        font-weight: 700;
        color: ${primaryColor};
        letter-spacing: 2px;
        margin: 8px 0;
      }
      .coupon-widget-code-label {
        font-size: 12px;
        color: ${isDark ? '#a0a0a0' : '#6b7280'};
        text-transform: uppercase;
        letter-spacing: 1px;
      }
      .coupon-widget-error {
        background: ${isDark ? '#7f1d1d' : '#fee2e2'};
        border: 1px solid ${isDark ? '#991b1b' : '#fecaca'};
        color: ${isDark ? '#fca5a5' : '#991b1b'};
        padding: 12px;
        border-radius: 8px;
        margin: 16px 0;
        font-size: 14px;
        text-align: center;
      }
      .coupon-widget-out-of-stock {
        text-align: center;
        padding: 24px;
        color: ${isDark ? '#a0a0a0' : '#6b7280'};
      }
      .coupon-widget-out-of-stock-icon {
        font-size: 48px;
        margin-bottom: 16px;
        opacity: 0.5;
      }
      .coupon-widget-copy-button {
        background: ${isDark ? '#2a2a2a' : '#f3f4f6'};
        color: ${textColor};
        border: 1px solid ${borderColor};
        padding: 10px 20px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        margin-top: 12px;
        transition: all 0.2s ease;
      }
      .coupon-widget-copy-button:hover {
        background: ${isDark ? '#333333' : '#e5e7eb'};
      }
      .coupon-widget-copy-button.copied {
        background: #10b981;
        color: white;
        border-color: #10b981;
      }
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .coupon-widget-hidden {
        display: none;
      }
    `
  }

  /**
   * Inject styles into the page
   */
  function injectStyles(theme) {
    const styleId = 'coupon-widget-styles'
    if (document.getElementById(styleId)) {
      return
    }

    const style = document.createElement('style')
    style.id = styleId
    style.textContent = createStyles(theme)
    document.head.appendChild(style)
  }

  /**
   * Fetch available coupons
   */
  async function fetchAvailableCoupons(vendorId, retries = 0) {
    try {
      const response = await fetch(
        `${CONFIG.API_BASE_URL}/api/widget/coupons?vendor_id=${vendorId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch coupons')
      }

      return data.data || []
    } catch (error) {
      if (retries < CONFIG.MAX_RETRIES) {
        await new Promise((resolve) => setTimeout(resolve, CONFIG.RETRY_DELAY))
        return fetchAvailableCoupons(vendorId, retries + 1)
      }
      throw error
    }
  }

  /**
   * Claim a coupon
   */
  async function claimCoupon(couponId, userEmail, retries = 0) {
    try {
      const response = await fetch(`${CONFIG.API_BASE_URL}/api/widget/claim`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          coupon_id: couponId,
          user_email: userEmail,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to claim coupon')
      }

      return data.data
    } catch (error) {
      if (retries < CONFIG.MAX_RETRIES) {
        await new Promise((resolve) => setTimeout(resolve, CONFIG.RETRY_DELAY))
        return claimCoupon(couponId, userEmail, retries + 1)
      }
      throw error
    }
  }

  /**
   * Widget instance class
   */
  class CouponWidgetInstance {
    constructor(config) {
      this.config = {
        vendorId: config.vendorId || '',
        userId: config.userId || '',
        campaignId: config.campaignId || '',
        theme: config.theme || 'light',
        containerId: config.containerId || 'coupon-widget',
        title: config.title || 'Claim Your Coupon',
        description: config.description || 'Get exclusive discounts and offers',
      }

      this.state = {
        status: 'idle', // idle, loading, success, error, out-of-stock, already-claimed
        coupon: null,
        error: null,
        availableCoupons: [],
      }

      this.container = null
      this.instanceId = `${this.config.containerId}-${Date.now()}`
      this.antiSpamToken = generateAntiSpamToken()
    }

    init() {
      // Find container
      this.container = document.getElementById(this.config.containerId)
      if (!this.container) {
        console.error(`CouponWidget: Container #${this.config.containerId} not found`)
        return
      }

      // Inject styles
      injectStyles(this.config.theme)

      // Add theme class
      if (this.config.theme === 'dark') {
        this.container.classList.add('dark')
      }

      // Render initial state
      this.render()

      // Pre-fetch available coupons
      this.loadAvailableCoupons()
    }

    async loadAvailableCoupons() {
      if (!this.config.vendorId) {
        this.setState({ status: 'error', error: 'Vendor ID is required' })
        return
      }

      try {
        const coupons = await fetchAvailableCoupons(this.config.vendorId)
        this.setState({
          availableCoupons: coupons,
          status: coupons.length === 0 ? 'out-of-stock' : 'idle',
        })
      } catch (error) {
        this.setState({ status: 'error', error: 'Failed to load coupons. Please try again.' })
      }
    }

    async handleClaim(userEmail) {
      // Validate email
      if (!userEmail || !userEmail.includes('@')) {
        this.setState({ status: 'error', error: 'Please enter a valid email address' })
        return
      }

      // Rate limiting
      if (!checkRateLimit(this.instanceId)) {
        this.setState({ status: 'error', error: 'Please wait before trying again' })
        return
      }

      // Check if we have available coupons
      if (this.state.availableCoupons.length === 0) {
        await this.loadAvailableCoupons()
        if (this.state.availableCoupons.length === 0) {
          this.setState({ status: 'out-of-stock' })
          return
        }
      }

      // Get first available coupon
      const coupon = this.state.availableCoupons[0]

      this.setState({ status: 'loading' })

      try {
        const claimedCoupon = await claimCoupon(coupon.id, userEmail)

        // Remove claimed coupon from available list
        this.setState({
          status: 'success',
          coupon: claimedCoupon,
          availableCoupons: this.state.availableCoupons.filter((c) => c.id !== coupon.id),
        })
      } catch (error) {
        // Handle specific error cases
        if (error.message.includes('already been claimed')) {
          // Refresh available coupons
          await this.loadAvailableCoupons()
          if (this.state.availableCoupons.length === 0) {
            this.setState({ status: 'out-of-stock' })
          } else {
            this.setState({ status: 'error', error: 'This coupon was already claimed. Please try again.' })
          }
        } else if (error.message.includes('User not found')) {
          this.setState({ status: 'error', error: 'User not found. Please ensure you have an account.' })
        } else {
          this.setState({ status: 'error', error: error.message || 'Failed to claim coupon. Please try again.' })
        }
      }
    }

    setState(newState) {
      this.state = { ...this.state, ...newState }
      this.render()
    }

    render() {
      if (!this.container) return

      const { status, coupon, error, availableCoupons } = this.state
      const isDark = this.config.theme === 'dark'

      let html = ''

      if (status === 'success' && coupon) {
        html = `
          <div class="coupon-widget-success">
            <div class="coupon-widget-success-icon">✓</div>
            <h3 class="coupon-widget-title" style="color: ${isDark ? '#ffffff' : '#1a1a1a'}; margin-bottom: 8px;">
              Coupon Claimed Successfully!
            </h3>
            <div class="coupon-widget-code">
              <div class="coupon-widget-code-label">Your Coupon Code</div>
              <div class="coupon-widget-code-value">${sanitizeHTML(coupon.code)}</div>
              ${coupon.discount_value ? `<div style="font-size: 14px; color: ${isDark ? '#a0a0a0' : '#6b7280'}; margin-top: 8px;">${sanitizeHTML(coupon.discount_value)}</div>` : ''}
              ${coupon.description ? `<div style="font-size: 12px; color: ${isDark ? '#a0a0a0' : '#6b7280'}; margin-top: 4px;">${sanitizeHTML(coupon.description)}</div>` : ''}
            </div>
            <button class="coupon-widget-copy-button" onclick="CouponWidget.copyCode('${this.instanceId}', '${sanitizeHTML(coupon.code)}', event)">
              Copy Code
            </button>
          </div>
        `
      } else if (status === 'out-of-stock') {
        html = `
          <div class="coupon-widget-out-of-stock">
            <div class="coupon-widget-out-of-stock-icon">📭</div>
            <h3 class="coupon-widget-title" style="color: ${isDark ? '#a0a0a0' : '#6b7280'};">
              Out of Stock
            </h3>
            <p style="font-size: 14px; margin: 0;">
              All coupons have been claimed. Check back later for new offers!
            </p>
          </div>
        `
      } else {
        html = `
          <div class="coupon-widget-header">
            <h2 class="coupon-widget-title">${sanitizeHTML(this.config.title)}</h2>
            <p class="coupon-widget-description">${sanitizeHTML(this.config.description)}</p>
          </div>
          ${error ? `<div class="coupon-widget-error">${sanitizeHTML(error)}</div>` : ''}
          <form onsubmit="CouponWidget.handleSubmit(event, '${this.instanceId}')">
            <input
              type="email"
              id="${this.instanceId}-email"
              placeholder="Enter your email"
              required
              style="width: 100%; padding: 12px; border: 1px solid ${isDark ? '#333333' : '#e5e7eb'}; border-radius: 8px; font-size: 14px; background: ${isDark ? '#2a2a2a' : '#ffffff'}; color: ${isDark ? '#ffffff' : '#1a1a1a'}; box-sizing: border-box;"
            />
            <button
              type="submit"
              class="coupon-widget-button"
              ${status === 'loading' ? 'disabled' : ''}
            >
              ${status === 'loading' ? '<span class="coupon-widget-loading"></span>' : ''}
              ${status === 'loading' ? 'Claiming...' : 'Claim Now'}
            </button>
          </form>
          ${availableCoupons.length > 0 ? `<p style="text-align: center; font-size: 12px; color: ${isDark ? '#a0a0a0' : '#6b7280'}; margin-top: 12px;">${availableCoupons.length} coupon${availableCoupons.length > 1 ? 's' : ''} available</p>` : ''}
        `
      }

      this.container.innerHTML = html
      this.container.className = `coupon-widget-container ${this.config.theme === 'dark' ? 'dark' : ''}`
    }
  }

  /**
   * Main widget object
   */
  const CouponWidget = {
    /**
     * Initialize widget from data attributes
     */
    initFromAttributes() {
      const containers = document.querySelectorAll('[id^="coupon-widget"], [data-coupon-widget]')

      containers.forEach((container) => {
        const vendorId = container.getAttribute('data-vendor-id') || container.getAttribute('data-vendor')
        const userId = container.getAttribute('data-user-id')
        const campaignId = container.getAttribute('data-campaign-id')
        const theme = container.getAttribute('data-theme') || 'light'
        const containerId = container.id || `coupon-widget-${Date.now()}`
        const title = container.getAttribute('data-title')
        const description = container.getAttribute('data-description')

        if (!vendorId) {
          console.error('CouponWidget: data-vendor-id is required')
          return
        }

        if (!container.id) {
          container.id = containerId
        }

        const instance = new CouponWidgetInstance({
          vendorId,
          userId,
          campaignId,
          theme,
          containerId,
          title,
          description,
        })

        widgetState.instances.set(containerId, instance)
        instance.init()
      })
    },

    /**
     * Initialize widget programmatically
     */
    init(config) {
      if (!config.vendorId) {
        console.error('CouponWidget: vendorId is required')
        return
      }

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

    /**
     * Handle form submission
     */
    handleSubmit(event, instanceId) {
      event.preventDefault()
      const instance = widgetState.instances.get(instanceId)
      if (!instance) return

      const emailInput = document.getElementById(`${instanceId}-email`)
      if (emailInput) {
        instance.handleClaim(emailInput.value)
      }
    },

    /**
     * Copy coupon code to clipboard
     */
    copyCode(instanceId, code, event) {
      const copyToClipboard = (text) => {
        if (navigator.clipboard) {
          return navigator.clipboard.writeText(text)
        } else {
          // Fallback for older browsers
          const textarea = document.createElement('textarea')
          textarea.value = text
          textarea.style.position = 'fixed'
          textarea.style.opacity = '0'
          document.body.appendChild(textarea)
          textarea.select()
          const success = document.execCommand('copy')
          document.body.removeChild(textarea)
          return success ? Promise.resolve() : Promise.reject()
        }
      }

      copyToClipboard(code).then(() => {
        const button = event?.target || document.querySelector(`[onclick*="${instanceId}"]`)
        if (button) {
          const originalText = button.textContent
          button.textContent = '✓ Copied!'
          button.classList.add('copied')
          setTimeout(() => {
            button.textContent = originalText
            button.classList.remove('copied')
          }, 2000)
        }
      }).catch(() => {
        console.error('Failed to copy code to clipboard')
      })
    },
  }

  // Expose to global scope (namespaced)
  window.CouponWidget = CouponWidget

  // Auto-initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      CouponWidget.initFromAttributes()
    })
  } else {
    CouponWidget.initFromAttributes()
  }
})(window, document)

