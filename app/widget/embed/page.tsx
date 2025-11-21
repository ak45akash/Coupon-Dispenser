'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

// Widget embed page - designed to be loaded in iframe
// This page renders the card-based coupon widget
function WidgetEmbedContent() {
  const searchParams = useSearchParams()
  const vendorId = searchParams.get('vendor_id') || searchParams.get('vendor') || ''
  const userId = searchParams.get('user_id') || ''
  const theme = searchParams.get('theme') || 'light'

  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && vendorId) {
      // Load script if not already loaded
      const loadScript = () => {
        if (document.querySelector('script[src*="widget-embed.js"]')) {
          // Script already loaded, initialize
          if (window.CouponWidget) {
            window.CouponWidget.init({
              vendorId,
              userId: userId || undefined,
              theme: theme as 'light' | 'dark',
              containerId: 'coupon-widget-embed',
            })
          }
        } else {
          // Load script
          const script = document.createElement('script')
          script.src = '/widget-embed.js'
          script.onload = () => {
            if (window.CouponWidget) {
              window.CouponWidget.init({
                vendorId,
                userId: userId || undefined,
                theme: theme as 'light' | 'dark',
                containerId: 'coupon-widget-embed',
              })
            }
          }
          document.body.appendChild(script)
        }
      }

      // Wait a bit for DOM to be ready
      setTimeout(loadScript, 100)
    }
  }, [mounted, vendorId, userId, theme])

  if (!vendorId) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
        <p>Vendor ID is required. Please provide vendor_id in the URL.</p>
      </div>
    )
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      padding: '20px', 
      backgroundColor: theme === 'dark' ? '#1a1a1a' : '#f5f5f5' 
    }}>
      <div id="coupon-widget-embed"></div>
    </div>
  )
}

export default function WidgetEmbedPage() {
  return (
    <Suspense fallback={<div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>}>
      <WidgetEmbedContent />
    </Suspense>
  )
}

