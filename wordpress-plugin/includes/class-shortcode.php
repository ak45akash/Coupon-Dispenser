<?php
/**
 * Shortcode Handler Class
 * Handles [coupon_widget] shortcode
 */

if (!defined('ABSPATH')) {
    exit;
}

class Coupon_Dispenser_Shortcode {
    
    private static $instance = null;
    
    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    private function __construct() {
        // Register shortcode - will be called during 'init' action
        // Using 'init' hook ensures WordPress is ready
        error_log('[CouponDispenser] Shortcode class constructor called');
        
        if (!shortcode_exists('coupon_widget')) {
            add_shortcode('coupon_widget', array($this, 'render_shortcode'));
            error_log('[CouponDispenser] Shortcode [coupon_widget] REGISTERED');
        } else {
            error_log('[CouponDispenser] WARNING: Shortcode already exists, skipping registration');
        }
    }
    
    /**
     * Render coupon widget shortcode
     * 
     * @param array $atts Shortcode attributes
     * @param string $content Shortcode content (not used)
     * @return string HTML output
     */
    public function render_shortcode($atts, $content = null) {
        // ALWAYS log - don't require WP_DEBUG
        error_log('[CouponDispenser] ============================================');
        error_log('[CouponDispenser] Shortcode render_shortcode() CALLED');
        error_log('[CouponDispenser] Timestamp: ' . current_time('mysql'));
        
        // Parse attributes
        $atts = shortcode_atts(array(
            'container_id' => 'coupon-widget',
        ), $atts, 'coupon_widget');
        
        $vendor_id = get_option('cdw_vendor_id', '');
        $api_key = get_option('cdw_api_key', '');
        $api_base_url = get_option('cdw_api_base_url', 'https://your-domain.com');
        
        // ALWAYS log configuration
        error_log('[CouponDispenser] Shortcode - Vendor ID: ' . (!empty($vendor_id) ? substr($vendor_id, 0, 8) . '...' : 'EMPTY'));
        error_log('[CouponDispenser] Shortcode - API Key: ' . (!empty($api_key) ? 'SET' : 'EMPTY'));
        error_log('[CouponDispenser] Shortcode - API Base URL: ' . $api_base_url);
        error_log('[CouponDispenser] Shortcode - Container ID: ' . $atts['container_id']);
        
        // Validate configuration
        if (empty($vendor_id)) {
            error_log('[CouponDispenser] ERROR: Vendor ID is empty');
            return '<div class="cdw-error" style="padding: 15px; background: #fff3cd; border-left: 4px solid #ffc107; margin: 10px 0;">
                <strong>Coupon Dispenser Error:</strong> Vendor ID is not configured. Please go to <a href="' . admin_url('options-general.php?page=coupon-dispenser-widget') . '">Settings → Coupon Dispenser</a> to configure your plugin.
            </div>';
        }
        
        if (empty($api_key)) {
            error_log('[CouponDispenser] ERROR: API Key is empty');
            return '<div class="cdw-error" style="padding: 15px; background: #fff3cd; border-left: 4px solid #ffc107; margin: 10px 0;">
                <strong>Coupon Dispenser Error:</strong> API Key is not configured. Please go to <a href="' . admin_url('options-general.php?page=coupon-dispenser-widget') . '">Settings → Coupon Dispenser</a> to configure your plugin.
            </div>';
        }
        
        if (empty($api_base_url) || $api_base_url === 'https://your-domain.com') {
            error_log('[CouponDispenser] ERROR: API Base URL is empty or default');
            return '<div class="cdw-error" style="padding: 15px; background: #fff3cd; border-left: 4px solid #ffc107; margin: 10px 0;">
                <strong>Coupon Dispenser Error:</strong> API Base URL is not configured. Please go to <a href="' . admin_url('options-general.php?page=coupon-dispenser-widget') . '">Settings → Coupon Dispenser</a> to configure your plugin.
            </div>';
        }
        
        $container_id = esc_attr($atts['container_id']);
        
        // Get REST API endpoint URL for widget session token
        $rest_url = rest_url('coupon-dispenser/v1/token');
        
        // Ensure widget script is enqueued (only once, even if shortcode appears multiple times)
        $widget_script_url = $api_base_url . '/widget-embed.js';
        
        // Use a static flag to ensure script is only enqueued once
        static $script_enqueued = false;
        if (!$script_enqueued) {
            error_log('[CouponDispenser] Shortcode - Enqueuing script: ' . $widget_script_url);
            
            add_action('wp_enqueue_scripts', function() use ($widget_script_url, $api_base_url) {
                error_log('[CouponDispenser] Shortcode - wp_enqueue_scripts hook FIRED');
                
                wp_enqueue_script(
                    'coupon-dispenser-widget',
                    $widget_script_url,
                    array('jquery'), // Depend on jQuery
                    CDW_VERSION,
                    true // Load in footer
                );
                
                // Add inline script to configure API base URL and log script loading
                wp_add_inline_script('coupon-dispenser-widget', 
                    "console.log('[CouponDispenser] Script enqueued - URL: " . esc_js($widget_script_url) . "');" .
                    "window.COUPON_WIDGET_API_URL = '" . esc_js($api_base_url) . "';" .
                    "console.log('[CouponDispenser] API URL set to:', window.COUPON_WIDGET_API_URL);",
                    'before'
                );
                
                // Add script load detection
                wp_add_inline_script('coupon-dispenser-widget', 
                    "console.log('[CouponDispenser] Waiting for widget script to load...');" .
                    "var checkScript = setInterval(function() {" .
                    "  if (typeof window.CouponWidget !== 'undefined') {" .
                    "    console.log('[CouponDispenser] ✓ Widget script loaded successfully');" .
                    "    clearInterval(checkScript);" .
                    "  }" .
                    "}, 100);" .
                    "setTimeout(function() { clearInterval(checkScript); }, 10000);",
                    'after'
                );
                
                error_log('[CouponDispenser] Shortcode - Script enqueued successfully');
            }, 20); // Standard priority
            $script_enqueued = true;
        } else {
            error_log('[CouponDispenser] Shortcode - Script already enqueued, skipping');
        }
        
        ob_start();
        ?>
        <!-- Coupon Dispenser Widget Container - Start -->
        <div id="<?php echo esc_attr($container_id); ?>" 
             data-vendor-id="<?php echo esc_attr($vendor_id); ?>"
             data-api-key-endpoint="<?php echo esc_js($rest_url); ?>"
             class="coupon-dispenser-widget-container"
             style="min-height: 50px; border: 1px dashed #ccc; padding: 10px; margin: 10px 0;">
            <div style="color: #666; font-size: 12px;">
                Coupon Widget Container (ID: <?php echo esc_html($container_id); ?>) - Waiting for initialization...
            </div>
        </div>
        <!-- Coupon Dispenser Widget Container - End -->
        
        <!-- Widget script will automatically initialize this container -->
        <script>
        (function() {
            console.log('[CouponDispenser] ============================================');
            console.log('[CouponDispenser] SHORTCODE RENDERED - This proves shortcode is working');
            console.log('[CouponDispenser] Container ID:', '<?php echo esc_js($container_id); ?>');
            console.log('[CouponDispenser] Vendor ID:', '<?php echo esc_js(substr($vendor_id, 0, 8)); ?>...');
            console.log('[CouponDispenser] API Endpoint:', '<?php echo esc_js($rest_url); ?>');
            console.log('[CouponDispenser] Script URL:', '<?php echo esc_js($widget_script_url); ?>');
            console.log('[CouponDispenser] API Base URL:', '<?php echo esc_js($api_base_url); ?>');
            console.log('[CouponDispenser] Container element exists:', !!document.getElementById('<?php echo esc_js($container_id); ?>'));
            console.log('[CouponDispenser] ============================================');
            
            // Check if widget script is loaded
            setTimeout(function() {
                if (typeof window.CouponWidget === 'undefined') {
                    console.error('[CouponDispenser] ERROR: CouponWidget script not loaded!');
                    console.error('[CouponDispenser] Check if script URL is accessible:', '<?php echo esc_js($widget_script_url); ?>');
                } else {
                    console.log('[CouponDispenser] ✓ CouponWidget script is loaded');
                }
            }, 1000);
        })();
        </script>
        <?php
        $output = ob_get_clean();
        
        error_log('[CouponDispenser] Shortcode - HTML output generated, length: ' . strlen($output));
        error_log('[CouponDispenser] ============================================');
        
        return $output;
    }
}

