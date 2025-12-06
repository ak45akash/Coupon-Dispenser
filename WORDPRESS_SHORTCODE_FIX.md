# WordPress Shortcode Fix & API Key Manual Update

## Issues Fixed

### 1. Shortcode Not Rendering ✅
**Problem:** Shortcode `[coupon_widget]` was displaying as plain text instead of rendering the widget.

**Solution:**
- Fixed plugin initialization order
- Ensured shortcode is registered early in the plugin lifecycle
- Added proper error messages if plugin is not configured
- Improved widget script enqueueing to ensure it loads when shortcode is used
- Added validation for required settings (Vendor ID, API Key, API Base URL)

### 2. API Key Regeneration Process ✅
**Problem:** Users had to download a new plugin ZIP file every time API key was regenerated.

**Solution:**
- Enhanced WordPress settings page with "Show/Hide" button for API key
- Added clear instructions on how to manually update API key
- Removed requirement to download new plugin ZIP
- Updated dashboard messages to reflect new process

## Changes Made

### Plugin Files Updated:

1. **`wordpress-plugin/coupon-dispenser-widget.php`**
   - Fixed plugin initialization hook timing
   - Improved error handling

2. **`wordpress-plugin/includes/class-shortcode.php`**
   - Added proper validation messages
   - Improved widget script enqueueing
   - Better error display with links to settings page
   - Enhanced initialization logic

3. **`wordpress-plugin/includes/class-settings.php`**
   - Added "Show/Hide" button for API key field
   - Added masked API key display (shows last 8 characters)
   - Added prominent warning/info box about API key updates
   - Improved usage instructions
   - Better visual formatting

4. **`app/api/vendors/[id]/wordpress-plugin/route.ts`**
   - Updated plugin README to reflect manual API key update process

5. **`app/dashboard/vendors/[id]/page.tsx`**
   - Changed warning from amber (warning) to green (info)
   - Updated message to explain manual update process

## How It Works Now

### Initial Setup:
1. Download plugin ZIP from dashboard
2. Upload and activate in WordPress
3. Plugin is pre-configured with vendor ID and API key
4. Use shortcode `[coupon_widget]` in any page/post

### API Key Regeneration:
1. Regenerate API key in dashboard
2. Copy new API key
3. Go to WordPress: **Settings → Coupon Dispenser**
4. Paste new API key in the "API Key" field
5. Click "Save Settings"
6. Done! No need to download new plugin.

## Shortcode Usage

### Basic Usage:
```
[coupon_widget]
```

### With Custom Container ID:
```
[coupon_widget container_id="my-custom-widget"]
```

### Note:
- **No vendor_id needed** - it's pre-configured in the plugin
- Shortcode works immediately after plugin activation
- Widget automatically detects logged-in WordPress users

## Troubleshooting

### Shortcode Not Working?

1. **Check Plugin is Activated:**
   - Go to WordPress Admin → Plugins
   - Ensure "Coupon Dispenser Widget" is activated

2. **Check Configuration:**
   - Go to Settings → Coupon Dispenser
   - Verify Vendor ID, API Key, and API Base URL are set
   - If missing, the shortcode will show an error message with a link to settings

3. **Check Browser Console:**
   - Open browser DevTools (F12)
   - Look for error messages
   - Widget should log: "Coupon Dispenser Widget: Initialized"

4. **Verify Widget Script Loads:**
   - Check Network tab in DevTools
   - Look for `/widget-embed.js` request
   - Should return 200 OK

## Settings Page Features

- **Show/Hide API Key Button:** Toggle visibility of API key
- **Masked Key Display:** Shows current key (masked) for verification
- **Update Instructions:** Clear instructions on how to update API key
- **Usage Guide:** Examples and documentation
- **Error Messages:** Helpful error messages with links to fix issues

---

**Status:** ✅ Fixed and Enhanced  
**Author:** Akash  
**Website:** https://iakash.dev

