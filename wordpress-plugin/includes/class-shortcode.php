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
        add_shortcode('coupon_widget', array($this, 'render_shortcode'));
    }
    
    /**
     * Render coupon widget shortcode
     * 
     * @param array $atts Shortcode attributes
     * @return string HTML output
     */
    public function render_shortcode($atts) {
        // Parse attributes
        $atts = shortcode_atts(array(
            'container_id' => 'coupon-widget',
        ), $atts, 'coupon_widget');
        
        $vendor_id = get_option('cdw_vendor_id', '');
        $api_base_url = get_option('cdw_api_base_url', 'https://your-domain.com');
        
        // Validate configuration
        if (empty($vendor_id)) {
            return '<div class="cdw-error">Coupon Dispenser: Vendor ID is not configured. Please configure in Settings → Coupon Dispenser.</div>';
        }
        
        $container_id = esc_attr($atts['container_id']);
        
        // Get REST API endpoint URL for widget session token
        $rest_url = rest_url('coupon-dispenser/v1/token');
        
        // Generate unique instance ID
        $instance_id = 'cdw-' . uniqid();
        
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
                    console.log('Coupon Dispenser Widget: Initialized');
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

