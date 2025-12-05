# WordPress Plugin Usage Guide

## 🚀 Quick Start Guide

### Step 1: Activate the Plugin

1. Go to your WordPress admin dashboard
2. Navigate to **Plugins → Installed Plugins**
3. Find **"Coupon Dispenser Widget"** in the list
4. Click **"Activate"**

✅ The plugin is now active!

---

### Step 2: Verify Configuration

The plugin should be **pre-configured** with your vendor ID and API key when downloaded from the dashboard. However, let's verify:

1. Go to **Settings → Coupon Dispenser** in WordPress admin
2. Check that the following fields are filled:
   - **Vendor ID**: Should be a UUID (e.g., `550e8400-e29b-41d4-a716-446655440000`)
   - **API Key**: Should start with `cdk_`
   - **API Base URL**: Should be your platform URL (e.g., `https://your-domain.com`)

**If any fields are empty or show placeholders:**
- Copy your Vendor ID and API Key from your Coupon Dispenser dashboard
- Paste them into the settings page
- Click **"Save Settings"**

---

### Step 3: Use the Shortcode

The plugin provides a simple shortcode to display coupons anywhere on your site.

#### Basic Usage:
```
[coupon_widget]
```

#### With Custom Container ID:
```
[coupon_widget container_id="my-custom-coupons"]
```

#### Where to Add the Shortcode:

**Option 1: In a Page/Post**
1. Edit any page or post
2. Add the shortcode `[coupon_widget]` in the content
3. Publish/Update the page

**Option 2: In a Widget**
1. Go to **Appearance → Widgets**
2. Add a **"Shortcode"** widget (if available) or **"Text"** widget
3. Add `[coupon_widget]` in the widget content
4. Save

**Option 3: In Theme Template**
1. Edit your theme template file (e.g., `single.php`, `page.php`)
2. Add: `<?php echo do_shortcode('[coupon_widget]'); ?>`

**Option 4: In Elementor/Page Builder**
1. Add a **"Shortcode"** widget
2. Enter `[coupon_widget]`
3. Save

---

### Step 4: Test the Widget

1. **Visit a page** where you added the shortcode
2. **Check browser console** (F12 → Console tab) for any errors
3. **Verify you're logged in** to WordPress (the widget requires user authentication)
4. **Look for coupons** - they should appear automatically

**Expected Behavior:**
- Widget loads automatically
- Coupons display in a grid layout
- Logged-in users can see and claim coupons
- Non-logged-in users won't see coupons (or will see an error)

---

## 🔧 Configuration Details

### Settings Page Location:
**WordPress Admin → Settings → Coupon Dispenser**

### Settings Fields:

1. **Vendor ID** (Required)
   - Format: UUID (e.g., `550e8400-e29b-41d4-a716-446655440000`)
   - Get this from: Coupon Dispenser Dashboard → Vendors → Your Vendor → Copy Vendor ID

2. **API Key** (Required)
   - Format: Starts with `cdk_` (e.g., `cdk_abc123...`)
   - Get this from: Coupon Dispenser Dashboard → Vendors → Your Vendor → API Key Method tab → Generate API Key

3. **API Base URL** (Required)
   - Format: Your platform URL (e.g., `https://your-domain.com`)
   - Should NOT have a trailing slash
   - This is where your Coupon Dispenser platform is hosted

---

## 🎯 How It Works

### Automatic User Detection:
- The plugin **automatically detects** the logged-in WordPress user
- Uses WordPress user ID to authenticate with the Coupon Dispenser API
- No manual user ID configuration needed!

### Authentication Flow:
```
1. User visits page with [coupon_widget] shortcode
2. Widget loads and calls WordPress REST API: /wp-json/coupon-dispenser/v1/token
3. Plugin validates WordPress user → Gets user ID
4. Plugin calls Coupon Dispenser API: /api/widget-session
   - Sends: API Key + Vendor ID + WordPress User ID
5. Receives widget session token
6. Widget uses token to fetch and display coupons
7. User can claim coupons (monthly limits enforced)
```

---

## 🐛 Troubleshooting

### Widget Not Showing?

**Check 1: Plugin is Activated**
- Go to **Plugins → Installed Plugins**
- Ensure "Coupon Dispenser Widget" is **Active**

**Check 2: Configuration is Complete**
- Go to **Settings → Coupon Dispenser**
- Verify all three fields are filled (Vendor ID, API Key, API Base URL)
- Click **"Save Settings"** if you made changes

**Check 3: User is Logged In**
- The widget requires WordPress user authentication
- Log in to WordPress and try again
- Non-logged-in users won't see coupons

**Check 4: Browser Console**
- Press **F12** to open Developer Tools
- Go to **Console** tab
- Look for error messages
- Common errors:
  - `Failed to authenticate` → Check API Key
  - `Vendor not found` → Check Vendor ID
  - `Network error` → Check API Base URL

**Check 5: REST API is Working**
- The plugin uses WordPress REST API
- Test: Visit `https://your-site.com/wp-json/coupon-dispenser/v1/token` (while logged in)
- Should return a token or error message

### Error Messages:

**"Vendor ID is not configured"**
- Go to **Settings → Coupon Dispenser**
- Enter your Vendor ID
- Save settings

**"Failed to authenticate"**
- Check your API Key is correct
- Verify API Key is active in Coupon Dispenser dashboard
- Check API Base URL is correct

**"Network error" or "Failed to fetch"**
- Check API Base URL is correct
- Verify your Coupon Dispenser platform is accessible
- Check for CORS issues (if API is on different domain)

**"No coupons available"**
- Check that your vendor has active coupons in the dashboard
- Verify coupons haven't all been permanently claimed
- Check monthly limit hasn't been reached

---

## 📝 Examples

### Example 1: Simple Page
Create a page called "Coupons" and add:
```
Welcome to our coupons page!

[coupon_widget]

Browse and claim your favorite coupons above.
```

### Example 2: Multiple Widgets
You can use multiple widgets with different container IDs:
```
[coupon_widget container_id="featured-coupons"]
[coupon_widget container_id="all-coupons"]
```

### Example 3: In Sidebar Widget
1. Go to **Appearance → Widgets**
2. Add **"Text"** widget to sidebar
3. Add: `[coupon_widget]`
4. Save

---

## 🔒 Security Notes

- ✅ API Key is stored securely in WordPress database
- ✅ Never exposed to frontend
- ✅ Only accessible via WordPress REST API (requires authentication)
- ✅ User must be logged in to WordPress to see coupons

---

## 📞 Need Help?

1. **Check Settings**: Settings → Coupon Dispenser
2. **Check Browser Console**: F12 → Console tab
3. **Verify API Key**: Coupon Dispenser Dashboard → API Key Method tab
4. **Test REST API**: Visit `/wp-json/coupon-dispenser/v1/token` (while logged in)

---

## ✅ Quick Checklist

- [ ] Plugin is activated
- [ ] Settings are configured (Vendor ID, API Key, API Base URL)
- [ ] User is logged in to WordPress
- [ ] Shortcode `[coupon_widget]` is added to page
- [ ] Browser console shows no errors
- [ ] Coupons are displaying

---

**That's it! You're ready to use the Coupon Dispenser Widget on your WordPress site!** 🎉

