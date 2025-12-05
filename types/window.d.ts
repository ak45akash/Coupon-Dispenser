// Type definitions for window global objects

interface CouponWidget {
  init: (config: {
    vendorId: string
    userId?: string
    theme?: 'light' | 'dark'
    containerId?: string
    previewMode?: boolean
  }) => void
}

interface Window {
  CouponWidget?: CouponWidget
  sendCouponToken?: (token: string) => void
  COUPON_WIDGET_API_URL?: string
  COUPON_WIDGET_USER_ID?: string
}

