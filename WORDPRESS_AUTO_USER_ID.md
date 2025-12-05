# Automatic User ID Detection for WordPress

The widget now **automatically detects user IDs** from WordPress! No manual configuration needed in most cases.

## How It Works

The widget automatically checks for user IDs from:

1. **WordPress REST API** (`wpApiSettings.currentUser`)
2. **WordPress Meta Tags** (`<meta name="wp-user-id">`)
3. **WooCommerce** (`wc_add_to_cart_params.current_user_id`)
4. **Custom Global Variable** (`window.COUPON_WIDGET_USER_ID`)
5. **Body/HTML Data Attributes** (`data-user-id`)

If no user ID is found, it automatically generates an anonymous ID (stored in localStorage).

## WordPress Setup (REQUIRED for proper user tracking)

**IMPORTANT:** Without this setup, each browser will generate a different anonymous ID, allowing the same user to claim multiple coupons from different browsers. Add this to your WordPress theme's `functions.php` to ensure proper user tracking:

```php
/**
 * Expose WordPress user ID to coupon widget
 * Add this to your theme's functions.php or a custom plugin
 */
function expose_user_id_to_coupon_widget() {
    if (is_user_logged_in()) {
        $user_id = get_current_user_id();
        ?>
        <script>
            // Method 1: Set global variable (recommended)
            window.COUPON_WIDGET_USER_ID = '<?php echo esc_js($user_id); ?>';
            
            // Method 2: Add to body data attribute
            document.body.setAttribute('data-user-id', '<?php echo esc_js($user_id); ?>');
            
            // Method 3: Add meta tag
            var meta = document.createElement('meta');
            meta.name = 'wp-user-id';
            meta.content = '<?php echo esc_js($user_id); ?>';
            document.getElementsByTagName('head')[0].appendChild(meta);
        </script>
        <?php
    }
}
add_action('wp_footer', 'expose_user_id_to_coupon_widget');
```

## Usage

### Simple Embed (No User ID needed!)

```html
<script src="https://your-domain.com/widget-embed.js"></script>
<div id="coupon-widget" 
     data-vendor-id="YOUR_VENDOR_ID" 
     data-theme="light">
</div>
```

The widget will:
- ✅ Automatically detect WordPress user ID if user is logged in
- ✅ Use anonymous ID if user is not logged in
- ✅ Work seamlessly without any manual configuration

### With Explicit User ID (Optional)

If you want to override auto-detection:

```html
<script src="https://your-domain.com/widget-embed.js"></script>
<div id="coupon-widget" 
     data-vendor-id="YOUR_VENDOR_ID" 
     data-user-id="123"
     data-theme="light">
</div>
```

## For Elementor Users

1. Add an **HTML widget** in Elementor
2. Paste the simple embed code (without `data-user-id`)
3. The widget will automatically detect the WordPress user ID
4. Save and publish!

## Benefits

- ✅ **No manual configuration** - Works out of the box
- ✅ **Automatic WordPress integration** - Detects logged-in users
- ✅ **Anonymous support** - Works for guests too
- ✅ **Persistent tracking** - Anonymous IDs stored in localStorage
- ✅ **30-day claim limit** - Enforced for both authenticated and anonymous users

## Testing

1. **As logged-in user**: Widget will use your WordPress user ID
2. **As guest**: Widget will generate and use an anonymous ID
3. **Check browser console**: Look for "CouponWidget: Detected..." messages

## Troubleshooting

### Widget not detecting user ID?

1. **Check browser console** for detection messages
2. **Verify WordPress is loaded** - Make sure `wpApiSettings` is available
3. **Add the functions.php snippet** above to ensure user ID is exposed
4. **Check if user is logged in** - Anonymous detection works for guests

### Still using anonymous ID?

- This is normal for guests/non-logged-in users
- Anonymous IDs are stored in localStorage and persist across sessions
- The 30-day claim limit still applies

