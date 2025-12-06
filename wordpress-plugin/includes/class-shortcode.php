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
        if (!shortcode_exists('coupon_widget')) {
            add_shortcode('coupon_widget', array($this, 'render_shortcode'));
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
        // Parse attributes
        $atts = shortcode_atts(array(
            'container_id' => 'coupon-widget',
        ), $atts, 'coupon_widget');
        
        $vendor_id = get_option('cdw_vendor_id', '');
        $api_key = get_option('cdw_api_key', '');
        $api_base_url = get_option('cdw_api_base_url', 'https://your-domain.com');
        
        // Validate configuration
        if (empty($vendor_id)) {
            return '<div class="cdw-error" style="padding: 15px; background: #fff3cd; border-left: 4px solid #ffc107; margin: 10px 0;">
                <strong>Coupon Dispenser Error:</strong> Vendor ID is not configured. Please go to <a href="' . admin_url('options-general.php?page=coupon-dispenser-widget') . '">Settings → Coupon Dispenser</a> to configure your plugin.
            </div>';
        }
        
        if (empty($api_key)) {
            return '<div class="cdw-error" style="padding: 15px; background: #fff3cd; border-left: 4px solid #ffc107; margin: 10px 0;">
                <strong>Coupon Dispenser Error:</strong> API Key is not configured. Please go to <a href="' . admin_url('options-general.php?page=coupon-dispenser-widget') . '">Settings → Coupon Dispenser</a> to configure your plugin.
            </div>';
        }
        
        if (empty($api_base_url) || $api_base_url === 'https://your-domain.com') {
            return '<div class="cdw-error" style="padding: 15px; background: #fff3cd; border-left: 4px solid #ffc107; margin: 10px 0;">
                <strong>Coupon Dispenser Error:</strong> API Base URL is not configured. Please go to <a href="' . admin_url('options-general.php?page=coupon-dispenser-widget') . '">Settings → Coupon Dispenser</a> to configure your plugin.
            </div>';
        }
        
        $container_id = esc_attr($atts['container_id']);
        
        // Get REST API endpoint URL for widget session token
        $rest_url = rest_url('coupon-dispenser/v1/token');
        
        // Ensure widget script is enqueued
        $widget_script_url = $api_base_url . '/widget-embed.js';
        wp_enqueue_script(
            'coupon-dispenser-widget',
            $widget_script_url,
            array(),
            CDW_VERSION,
            true
        );
        
        // Add inline script to configure API base URL
        wp_add_inline_script('coupon-dispenser-widget', 
            "window.COUPON_WIDGET_API_URL = '" . esc_js($api_base_url) . "';",
            'before'
        );
        
        ob_start();
        ?>
        <div id="<?php echo esc_attr($container_id); ?>" 
             data-vendor-id="<?php echo esc_attr($vendor_id); ?>"
             data-api-key-endpoint="<?php echo esc_js($rest_url); ?>"
             class="coupon-dispenser-widget-container">
        </div>
        
        <script>
        (function() {
            // Wait for widget script to load
            function initWidget() {
                if (typeof window.CouponWidget !== 'undefined') {
                    // Widget will automatically initialize from data attributes
                    console.log('Coupon Dispenser Widget: Initialized in container <?php echo esc_js($container_id); ?>');
                } else {
                    // Retry after a short delay
                    setTimeout(initWidget, 100);
                }
            }
            
            // Start initialization
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', initWidget);
            } else {
                initWidget();
            }
        })();
        </script>
        <?php
        return ob_get_clean();
    }
}

