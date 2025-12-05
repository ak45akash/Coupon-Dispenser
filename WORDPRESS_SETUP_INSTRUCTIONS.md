# WordPress Setup Instructions - REQUIRED

## ⚠️ IMPORTANT: You MUST add this code to your WordPress theme

Without this code, each browser will generate a different anonymous user ID, allowing the same user to claim multiple coupons from different browsers.

## Step-by-Step Instructions

### 1. Access Your WordPress Theme Files

**Option A: Via WordPress Admin (Recommended)**
1. Go to **Appearance → Theme File Editor**
2. Select your active theme
3. Click on **functions.php** in the file list
4. Scroll to the bottom of the file

**Option B: Via FTP/cPanel**
1. Connect to your WordPress site via FTP or cPanel File Manager
2. Navigate to `/wp-content/themes/[your-theme-name]/`
3. Open `functions.php`

### 2. Add This Code

Copy and paste this code at the **END** of your `functions.php` file (before the closing `?>` tag if present, or just at the end):

```php
/**
 * Expose WordPress user ID to coupon widget
 * REQUIRED for proper user tracking across browsers
 * 
 * This ensures the same WordPress user gets the same user ID
 * across all browsers, preventing multiple coupon claims.
 */
function expose_user_id_to_coupon_widget() {
    if (is_user_logged_in()) {
        $user_id = get_current_user_id();
        ?>
        <script>
            // Set global variable (widget will detect this)
            window.COUPON_WIDGET_USER_ID = '<?php echo esc_js($user_id); ?>';
            
            // Also add to body data attribute (backup method)
            if (document.body) {
                document.body.setAttribute('data-user-id', '<?php echo esc_js($user_id); ?>');
            } else {
                // If body not ready, set it when DOM is ready
                document.addEventListener('DOMContentLoaded', function() {
                    document.body.setAttribute('data-user-id', '<?php echo esc_js($user_id); ?>');
                });
            }
            
            // Debug: Log to console to verify it's working
            console.log('✅ WordPress Helper: User ID set to', window.COUPON_WIDGET_USER_ID);
        </script>
        <?php
    } else {
        // Set empty value so widget knows helper code is present
        ?>
        <script>
            window.COUPON_WIDGET_USER_ID = '';
            console.log('ℹ️ WordPress Helper: User is not logged in');
        </script>
        <?php
    }
}
add_action('wp_footer', 'expose_user_id_to_coupon_widget');
```

### 3. Save the File

- Click **Update File** (if using Theme Editor)
- Or save the file if using FTP/cPanel

### 4. Clear Cache (If Using Caching Plugin)

If you're using a caching plugin (WP Super Cache, W3 Total Cache, etc.):
1. Clear all cache
2. Purge CDN cache if applicable

### 5. Test

1. **Make sure you're logged into WordPress**
2. **Open your WordPress page with the widget**
3. **Open browser console (F12)**
4. **Look for these messages:**
   - ✅ `WordPress Helper: User ID set to [your-user-id]` ← This confirms it's working!
   - ✅ `CouponWidget: ✅ Detected WordPress user ID from helper code: [your-user-id]`

### 6. Verify It's Working

1. **Claim a coupon** from one browser
2. **Open a different browser** (or incognito mode)
3. **Log in with the same WordPress user**
4. **Try to claim another coupon** from the same vendor
5. **You should see:** "You already have an active coupon" error

## Troubleshooting

### ❌ Not seeing "WordPress Helper: User ID set to..." in console?

**Possible causes:**
1. **Code not saved** - Check that you saved functions.php
2. **Wrong theme** - Make sure you edited the ACTIVE theme's functions.php
3. **Caching** - Clear all caches (browser, WordPress, CDN)
4. **Syntax error** - Check for PHP syntax errors in functions.php
5. **Plugin conflict** - Temporarily disable other plugins to test

### ❌ Still using anonymous IDs?

1. **Check if you're logged in** - The helper code only works for logged-in users
2. **Check browser console** - Look for error messages
3. **Verify code is in functions.php** - Make sure the code is actually in the file
4. **Check file permissions** - Make sure functions.php is writable

### ❌ Getting PHP errors?

1. **Check for syntax errors** - Make sure you copied the code exactly
2. **Check PHP version** - WordPress requires PHP 7.4+
3. **Check for conflicts** - Other code in functions.php might conflict

## Alternative: Use a Plugin

If you don't want to edit functions.php directly, you can create a simple plugin:

1. Create a new file: `/wp-content/plugins/coupon-widget-helper.php`
2. Add this code:

```php
<?php
/**
 * Plugin Name: Coupon Widget Helper
 * Description: Exposes WordPress user ID to coupon widget
 * Version: 1.0
 */

function expose_user_id_to_coupon_widget() {
    if (is_user_logged_in()) {
        $user_id = get_current_user_id();
        ?>
        <script>
            window.COUPON_WIDGET_USER_ID = '<?php echo esc_js($user_id); ?>';
            if (document.body) {
                document.body.setAttribute('data-user-id', '<?php echo esc_js($user_id); ?>');
            }
            console.log('✅ WordPress Helper: User ID set to', window.COUPON_WIDGET_USER_ID);
        </script>
        <?php
    } else {
        ?>
        <script>
            window.COUPON_WIDGET_USER_ID = '';
        </script>
        <?php
    }
}
add_action('wp_footer', 'expose_user_id_to_coupon_widget');
```

3. Activate the plugin in WordPress admin

## Need Help?

If you're still having issues:
1. Check browser console for error messages
2. Verify you're logged into WordPress
3. Make sure the code is in the active theme's functions.php
4. Clear all caches

