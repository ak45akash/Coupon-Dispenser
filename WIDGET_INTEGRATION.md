# Widget Integration Guide

The Coupon Dispenser widget allows you to embed a coupon claim interface directly on your website.

## Basic Integration

### Step 1: Get Your Vendor ID

1. Log into your Coupon Dispenser dashboard
2. Navigate to Vendors
3. Copy your Vendor ID from the vendor list

### Step 2: Add Widget to Your Website

Add this code to any page where you want the widget to appear:

```html
<!DOCTYPE html>
<html>
<head>
    <title>My Website</title>
</head>
<body>
    <!-- Your page content -->
    
    <!-- Coupon Widget -->
    <script src="https://your-domain.vercel.app/widget.js"></script>
    <div id="coupon-widget" data-vendor="YOUR_VENDOR_ID"></div>
</body>
</html>
```

## Advanced Configuration

### Custom Theme

Add a `data-theme` attribute to customize the appearance:

```html
<div id="coupon-widget" 
     data-vendor="YOUR_VENDOR_ID"
     data-theme="dark"></div>
```

Available themes:
- `light` (default)
- `dark`

### Multiple Widgets

You can add multiple widgets for different vendors on the same page:

```html
<div id="coupon-widget-1" data-vendor="VENDOR_ID_1"></div>
<div id="coupon-widget-2" data-vendor="VENDOR_ID_2"></div>
```

## Styling

The widget is responsive and will adapt to your page width. You can customize the container:

```html
<style>
  #coupon-widget {
    max-width: 600px;
    margin: 0 auto;
    padding: 20px;
  }
</style>
```

## WordPress Integration

For WordPress sites:

1. Go to Appearance > Widgets
2. Add a "Custom HTML" widget
3. Paste the widget code
4. Save

Or use a shortcode plugin:
```php
[coupon_widget vendor="YOUR_VENDOR_ID"]
```

## Shopify Integration

1. Go to Online Store > Themes > Actions > Edit Code
2. Find the template where you want the widget (e.g., `page.liquid`)
3. Add the widget code
4. Save

## React/Next.js Integration

For React applications, create a component:

```tsx
'use client'

import { useEffect } from 'react'

interface CouponWidgetProps {
  vendorId: string
}

export function CouponWidget({ vendorId }: CouponWidgetProps) {
  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://your-domain.vercel.app/widget.js'
    script.async = true
    document.body.appendChild(script)

    return () => {
      document.body.removeChild(script)
    }
  }, [])

  return (
    <div id="coupon-widget" data-vendor={vendorId}></div>
  )
}
```

## API Alternative

Instead of using the widget, you can integrate directly with the API:

```javascript
async function claimCoupon(vendorId, userEmail) {
  const response = await fetch('https://your-domain.vercel.app/api/coupons/claim', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      vendor_id: vendorId,
      user_email: userEmail,
    }),
  })

  const data = await response.json()
  
  if (data.success) {
    console.log('Coupon code:', data.data.code)
  } else {
    console.error('Error:', data.error)
  }
}
```

## Security

The widget communicates securely with the Coupon Dispenser API:

- All requests use HTTPS
- Monthly claim limits are enforced server-side
- Email validation prevents spam
- CORS is properly configured

## Troubleshooting

### Widget Not Appearing

1. Check browser console for errors
2. Verify vendor ID is correct
3. Ensure script URL is correct

### Claims Not Working

1. Verify vendor has available coupons
2. Check if user has reached monthly limit
3. Ensure email validation passes

### Styling Issues

The widget uses CSS that shouldn't conflict with your site. If you see issues:

1. Check for CSS conflicts in browser dev tools
2. Use more specific selectors in your custom styles
3. Consider using the iframe version (future feature)

## Support

For integration help:
- Documentation: Check the main README
- Issues: Open a GitHub issue
- Email: support@your-domain.com

