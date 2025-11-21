# WordPress/Elementor Integration Guide

## ⚠️ IMPORTANT: Elementor Widget Options

**If you don't see an "HTML" widget in Elementor, use the iframe method below!**

The "Code Highlight" widget only displays code - it does NOT execute scripts.

## Quick Setup for WordPress/Elementor

### Method 1: Using Iframe Embed (RECOMMENDED for Elementor)

**This method works with Elementor's "Shortcode" widget - no HTML widget needed!**

1. **Copy the Iframe Code** from your vendor dashboard:
   - Click "Copy Widget" button above the coupons table
   - Select **"Iframe Embed (Elementor)"** from the dropdown
   - The iframe code will be copied to your clipboard

2. **In Elementor:**
   - Click "+" to add a widget
   - Search for **"Shortcode"** widget
   - Paste the iframe code into the shortcode widget
   - Replace `USER_ID_FROM_YOUR_SYSTEM` with your actual user ID
   - Click "Update" and "Publish"

3. **The widget will load in an iframe - works perfectly with Elementor!**

### Method 2: Using HTML Widget (If Available)

1. **Copy the Widget Script** from your vendor dashboard (button above coupons table)
2. **In Elementor:**
   - Click "+" to add a widget
   - Search for and select **"HTML"** widget (NOT "Code Highlight")
   - Paste the complete copied script code into the HTML widget
   - Replace `USER_ID_FROM_YOUR_SYSTEM` with your actual user ID
   - Click "Update" and "Publish"
3. **The widget will automatically load when the page is viewed**

### Step-by-Step Elementor Instructions (Iframe Method):

1. **In Elementor Editor:**
   - Click the "+" icon to add a widget
   - Type "Shortcode" in the search box
   - Select the **"Shortcode"** widget

2. **Paste Your Iframe Code:**
   - Copy the iframe code from your vendor dashboard (select "Iframe Embed" option)
   - Paste it into the Shortcode widget's text area
   - The iframe code looks like: `<iframe src="..."></iframe>`

3. **Replace User ID:**
   - Find `USER_ID_FROM_YOUR_SYSTEM` in the iframe URL
   - Replace it with your actual user ID from your system

4. **Save:**
   - Click "Update" in Elementor
   - Click "Publish" to make it live

**The iframe method is easier and works with all Elementor widgets!**

### Method 2: Using WordPress Custom HTML Block (Gutenberg)

1. **Copy the Widget Script** from your vendor dashboard
2. **In WordPress Editor:**
   - Click "+" to add a block
   - Search for "Custom HTML"
   - Paste the complete script code
   - Replace `USER_ID_FROM_YOUR_SYSTEM` with your user ID
   - Update the page

### Method 3: Using Shortcode (Advanced)

If Elementor HTML widget doesn't work, you can create a WordPress shortcode:

1. **Add to functions.php or a plugin:**
   ```php
   function coupon_widget_shortcode($atts) {
       $atts = shortcode_atts(array(
           'vendor_id' => '',
           'user_id' => '',
           'theme' => 'light'
       ), $atts);
       
       if (empty($atts['vendor_id'])) {
           return '<!-- Vendor ID required -->';
       }
       
       $script_url = 'https://your-domain.com/widget-embed.js';
       
       return "
       <script src=\"{$script_url}\"></script>
       <div id=\"coupon-widget\" 
            data-vendor-id=\"{$atts['vendor_id']}\" 
            data-user-id=\"{$atts['user_id']}\"
            data-theme=\"{$atts['theme']}\">
       </div>
       ";
   }
   add_shortcode('coupon_widget', 'coupon_widget_shortcode');
   ```

2. **Use in Elementor:**
   - Add "Shortcode" widget
   - Use: `[coupon_widget vendor_id="YOUR_VENDOR_ID" user_id="YOUR_USER_ID"]`

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

### Elementor HTML Widget - CRITICAL
- **MUST use "HTML" widget** (NOT "Code Highlight" - that only displays code!)
- Paste the complete script including both `<script>` and `<div>` tags
- The widget will automatically initialize when the page loads
- If widget doesn't appear, check browser console and try calling `CouponWidgetReinit()`

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
1. **VERIFY you're using HTML widget, NOT Code Highlight**
2. Open browser console (F12) and check for errors
3. Verify the script tag is actually executing (check Network tab)
4. Try calling `CouponWidgetReinit()` manually in console:
   ```javascript
   CouponWidgetReinit()
   ```
5. Verify the container div has the correct data attributes
6. Check that vendor ID is a valid UUID format
7. Ensure user ID is provided (not "USER_ID_FROM_YOUR_SYSTEM")

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

