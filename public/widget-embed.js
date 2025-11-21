/**
 * Coupon Dispenser Embeddable Widget
 * 
 * Card-based coupon widget for partner websites
 * 
 * Usage:
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

  async function fetchCouponsData(vendorId, userId, previewMode = false, retries = 0) {
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
      const url = userId 
        ? `${CONFIG.API_BASE_URL}/api/widget/coupons?vendor_id=${vendorId}&user_id=${userId}`
        : `${CONFIG.API_BASE_URL}/api/widget/coupons?vendor_id=${vendorId}`
      
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch coupons')
      }

      return data.data
    } catch (error) {
      if (retries < CONFIG.MAX_RETRIES) {
        await new Promise((resolve) => setTimeout(resolve, CONFIG.RETRY_DELAY))
        return fetchCouponsData(vendorId, userId, previewMode, retries + 1)
      }
      throw error
    }
  }

  async function claimCoupon(couponId, userId, previewMode = false, retries = 0) {
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
      const response = await fetch(`${CONFIG.API_BASE_URL}/api/widget/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coupon_id: couponId,
          user_id: userId,
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
      }

      this.state = {
        loading: true,
        vendor: null,
        coupons: [],
        claimedCoupons: new Map(), // couponId -> claimed coupon data
        errors: new Map(), // couponId -> error message
        hasActiveClaim: false,
        activeClaimExpiry: null,
      }

      this.container = null
      this.instanceId = `${this.config.containerId}-${Date.now()}`
    }

    init() {
      this.container = document.getElementById(this.config.containerId)
      if (!this.container) {
        console.error(`CouponWidget: Container #${this.config.containerId} not found`)
        return
      }

      injectStyles()
      this.render()
      this.loadData()
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
          this.config.previewMode
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
        this.setState({
          loading: false,
          error: 'Failed to load coupons. Please try again later.',
        })
      }
    }

    async handleGenerateCode(couponId) {
      if (!this.config.userId) {
        this.showError(couponId, 'User ID is required. Please configure the widget with a user ID.')
        return
      }

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
        const claimedCoupon = await claimCoupon(
          couponId, 
          this.config.userId,
          this.config.previewMode
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

      containers.forEach((container) => {
        // Skip if already initialized
        if (container.dataset.widgetInitialized === 'true') {
          return
        }

        const vendorId = container.getAttribute('data-vendor-id') || container.getAttribute('data-vendor')
        const userId = container.getAttribute('data-user-id')
        const theme = container.getAttribute('data-theme') || 'light'
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
          userId,
          theme,
          containerId,
        })

        widgetState.instances.set(containerId, instance)
        console.log(`CouponWidget: Initializing widget for container ${containerId}`)
        instance.init()
      })
    },

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
  
  // Also expose on window load (for very late loading)
  window.addEventListener('load', () => {
    setTimeout(initializeWidget, 500)
  })
})(window, document)
