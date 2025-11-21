# Embeddable Widget Guide

Complete guide for embedding the Coupon Dispenser widget on partner websites.

## Quick Start

### Basic Usage

Add the widget script to your HTML page:

```html
<script src="https://your-domain.com/widget-embed.js"></script>
<div id="coupon-widget" 
     data-vendor-id="YOUR_VENDOR_ID" 
     data-theme="light">
</div>
```

That's it! The widget will automatically initialize and render.

## Configuration Options

### Data Attributes

| Attribute | Required | Default | Description |
|-----------|----------|---------|-------------|
| `data-vendor-id` | ✅ Yes | - | Your vendor UUID from the dashboard |
| `data-user-id` | ❌ No | - | User ID for tracking (optional) |
| `data-campaign-id` | ❌ No | - | Campaign ID for analytics (optional) |
| `data-theme` | ❌ No | `light` | Theme: `light` or `dark` |
| `data-container-id` | ❌ No | `coupon-widget` | Custom container ID |
| `data-title` | ❌ No | "Claim Your Coupon" | Custom widget title |
| `data-description` | ❌ No | "Get exclusive discounts..." | Custom description |

### Example with All Options

```html
<div id="coupon-widget" 
     data-vendor-id="550e8400-e29b-41d4-a716-446655440000"
     data-user-id="user-123"
     data-campaign-id="summer-2024"
     data-theme="dark"
     data-title="Summer Special"
     data-description="Claim your exclusive summer discount">
</div>
```

## Programmatic Initialization

You can also initialize the widget using JavaScript:

```javascript
CouponWidget.init({
  vendorId: '550e8400-e29b-41d4-a716-446655440000',
  userId: 'user-123',
  campaignId: 'summer-2024',
  theme: 'light',
  containerId: 'my-coupon-widget',
  title: 'Special Offer',
  description: 'Get amazing discounts'
});
```

## Widget States

The widget handles multiple states automatically:

### 1. **Idle State**
- Shows email input form
- Displays "Claim Now" button
- Shows available coupon count

### 2. **Loading State**
- Button shows spinner
- Button is disabled
- Prevents multiple submissions

### 3. **Success State**
- Shows claimed coupon code
- Displays discount value and description
- Provides copy-to-clipboard button
- Animated success icon

### 4. **Error State**
- Shows error message
- Allows retry
- Handles specific errors:
  - "User not found"
  - "Coupon already claimed"
  - "No coupons available"
  - Network errors

### 5. **Out of Stock State**
- Shows "Out of Stock" message
- Displays empty state icon
- Suggests checking back later

## Security Features

The widget includes built-in security:

### Rate Limiting
- Prevents spam clicking
- 2-second minimum between clicks
- Automatic enforcement

### Anti-Spam Protection
- Generates unique tokens per instance
- Prevents automated attacks
- Client-side validation

### XSS Protection
- All user input is sanitized
- HTML escaping for all dynamic content
- Safe DOM manipulation

## Styling

The widget includes its own styles and won't conflict with your site's CSS. However, you can customize the appearance:

### Theme Options

**Light Theme** (default):
```html
<div data-theme="light"></div>
```

**Dark Theme**:
```html
<div data-theme="dark"></div>
```

### Custom Container Styling

You can style the container element:

```css
#coupon-widget {
  max-width: 500px; /* Override default max-width */
  margin: 20px auto;
}
```

## API Endpoints

The widget uses these public endpoints:

### Get Available Coupons
```
GET /api/widget/coupons?vendor_id={vendor_id}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "coupon-id",
      "code": "SAVE20",
      "description": "Save 20%",
      "discount_value": "20% off"
    }
  ],
  "count": 1
}
```

### Claim Coupon
```
POST /api/widget/claim
Content-Type: application/json

{
  "coupon_id": "coupon-id",
  "user_email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "coupon-id",
    "code": "SAVE20",
    "description": "Save 20%",
    "discount_value": "20% off",
    "is_claimed": true
  },
  "message": "Coupon claimed successfully"
}
```

## Error Handling

The widget handles all error scenarios:

| Error | Status Code | User Message |
|-------|-------------|--------------|
| User not found | 404 | "User not found. Please ensure you have an account." |
| Coupon already claimed | 409 | "This coupon was already claimed. Please try again." |
| No coupons available | 200 (empty) | "Out of Stock" |
| Network error | - | "Failed to load coupons. Please try again." |
| Rate limit | - | "Please wait before trying again" |

## Multi-Site Support

The widget works across multiple domains:

- Each instance is isolated
- No global namespace pollution
- Safe for embedding on any website
- CORS-enabled API endpoints

## Testing

### Local Testing

1. Start your development server:
```bash
npm run dev
```

2. Open the demo page:
```
http://localhost:3000/widget-demo.html
```

3. Replace `YOUR_VENDOR_ID` with an actual vendor ID from your database

### Production Testing

1. Deploy your application
2. Use the production URL in the script tag
3. Test on multiple domains to verify CORS

## Browser Support

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)
- ⚠️ IE11 (limited support, fallbacks included)

## Troubleshooting

### Widget Not Loading

1. Check browser console for errors
2. Verify script URL is correct
3. Ensure container element exists
4. Check CORS settings if loading from different domain

### Coupons Not Showing

1. Verify `vendor_id` is correct
2. Check that vendor has available coupons
3. Ensure API endpoint is accessible
4. Check browser network tab for API errors

### Claim Not Working

1. Verify user email exists in system
2. Check that coupon is not already claimed
3. Verify API endpoint is responding
4. Check browser console for errors

## Best Practices

1. **Always use HTTPS** in production
2. **Test on multiple browsers** before deploying
3. **Monitor API usage** for rate limiting
4. **Handle errors gracefully** in your implementation
5. **Use campaign IDs** for analytics tracking
6. **Test with real vendor IDs** before going live

## Support

For issues or questions:
- Check the demo page: `/widget-demo.html`
- Review API documentation: `/API.md`
- Check test files: `__tests__/widget/widget.test.ts`

## Example Integration

Complete example HTML page:

```html
<!DOCTYPE html>
<html>
<head>
  <title>My Store - Special Offers</title>
</head>
<body>
  <h1>Welcome to My Store</h1>
  
  <!-- Coupon Widget -->
  <script src="https://your-domain.com/widget-embed.js"></script>
  <div id="coupon-widget" 
       data-vendor-id="your-vendor-id"
       data-theme="light"
       data-title="Claim Your Discount"
       data-description="Get 20% off your first purchase">
  </div>
  
  <!-- Rest of your page -->
</body>
</html>
```

That's it! The widget will automatically initialize and handle all interactions.

