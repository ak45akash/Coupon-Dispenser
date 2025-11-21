# WordPress/Elementor Integration Guide

## Quick Setup for WordPress/Elementor

### Method 1: Using HTML Widget (Recommended)

1. **Copy the Widget Script** from your vendor dashboard
2. **In Elementor:**
   - Add an "HTML" widget to your page
   - Paste the copied script code
   - Replace `USER_ID_FROM_YOUR_SYSTEM` with your user ID
   - Save and publish

### Method 2: Using Code Block

1. **Copy the Widget Script** from your vendor dashboard
2. **In WordPress:**
   - Edit your page/post
   - Add a "Custom HTML" block
   - Paste the script code
   - Replace `USER_ID_FROM_YOUR_SYSTEM` with your user ID
   - Update the page

### Method 3: Using Theme Footer/Header

1. **Copy the script tag only:**
   ```html
   <script src="https://your-domain.com/widget-embed.js"></script>
   ```

2. **Add to WordPress:**
   - Go to Appearance → Theme Editor
   - Or use a plugin like "Insert Headers and Footers"
   - Add the script tag to the footer
   - Add the widget div where you want it to appear

## Important Notes for WordPress/Elementor

### Script URL
- **Development:** `http://localhost:3000/widget-embed.js`
- **Production:** Replace with your production domain
  ```html
  <script src="https://your-production-domain.com/widget-embed.js"></script>
  ```

### User ID
- You must replace `USER_ID_FROM_YOUR_SYSTEM` with the actual user ID
- Get the user ID from your authentication system
- The widget will not work without a valid user ID

### Elementor HTML Widget
- Use the "HTML" widget (not "Code Highlight")
- Paste the complete script including both `<script>` and `<div>` tags
- The widget will automatically initialize when the page loads

### Troubleshooting

**Widget not showing:**
1. Check browser console for errors
2. Verify the script URL is correct and accessible
3. Ensure vendor ID is valid (UUID format)
4. Check that user ID is provided

**Script not loading:**
1. Verify the script URL is accessible (try opening in browser)
2. Check for CORS issues if script is on different domain
3. Ensure WordPress/Elementor isn't blocking external scripts

**Widget not initializing:**
1. Open browser console and check for errors
2. Try calling `CouponWidgetReinit()` manually in console
3. Verify the container div has the correct data attributes

### Manual Initialization (if needed)

If the widget doesn't auto-initialize, you can manually trigger it:

```javascript
// In browser console or custom script
if (window.CouponWidgetReinit) {
  window.CouponWidgetReinit();
}
```

### Production Deployment

Before going live:
1. Replace `localhost:3000` with your production domain
2. Ensure CORS is configured for your production domain
3. Test the widget on a staging site first
4. Verify all vendor IDs and user IDs are correct

## Example for Elementor

1. **Add HTML Widget**
2. **Paste this code:**
   ```html
   <script src="https://your-domain.com/widget-embed.js"></script>
   <div id="coupon-widget" 
        data-vendor-id="YOUR_VENDOR_ID" 
        data-user-id="YOUR_USER_ID"
        data-theme="light">
   </div>
   ```
3. **Replace placeholders:**
   - `YOUR_VENDOR_ID` - Get from vendor dashboard
   - `YOUR_USER_ID` - Get from your user system
4. **Save and preview**

The widget will automatically render when the page loads!

