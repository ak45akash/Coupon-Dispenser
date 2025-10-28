/**
 * Coupon Dispenser Widget
 * 
 * Usage:
 * <script src="https://your-domain.com/widget.js"></script>
 * <div id="coupon-widget" data-vendor="VENDOR_ID"></div>
 */

(function () {
  'use strict'

  const WIDGET_URL = window.location.origin + '/widget'

  function initWidget() {
    const containers = document.querySelectorAll('[id^="coupon-widget"]')

    containers.forEach((container) => {
      const vendorId = container.getAttribute('data-vendor')
      const theme = container.getAttribute('data-theme') || 'light'

      if (!vendorId) {
        console.error('Coupon Widget: data-vendor attribute is required')
        return
      }

      // Create iframe
      const iframe = document.createElement('iframe')
      iframe.src = `${WIDGET_URL}?vendor=${vendorId}&theme=${theme}`
      iframe.style.width = '100%'
      iframe.style.height = '500px'
      iframe.style.border = 'none'
      iframe.style.borderRadius = '8px'

      container.appendChild(iframe)
    })
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWidget)
  } else {
    initWidget()
  }
})()

