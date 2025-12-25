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
        // Load AFTER jQuery and with lower priority to avoid Elementor conflicts
        $widget_script_url = $api_base_url . '/widget-embed.js';
        
        // Use a high priority number to ensure this loads after Elementor
        // Elementor typically uses priority 20, so we use 30 to load much later
        add_action('wp_enqueue_scripts', function() use ($widget_script_url) {
            wp_enqueue_script(
                'coupon-dispenser-widget',
                $widget_script_url,
                array('jquery'), // Depend on jQuery to ensure proper loading order
                CDW_VERSION,
                true
            );
        }, 30); // Higher priority = loads later (after Elementor's 20)
        
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
            // Isolated initialization to prevent Elementor conflicts
            // Use IIFE with strict mode to avoid namespace pollution
            'use strict';
            
            var initAttempts = 0;
            var maxAttempts = 50; // 5 seconds max wait
            
            function initWidget() {
                initAttempts++;
                
                // Check if widget script is loaded
                if (typeof window.CouponWidget === 'undefined') {
                    if (initAttempts < maxAttempts) {
                        setTimeout(initWidget, 100);
                    } else {
                        console.error('Coupon Dispenser Widget: Script failed to load after 5 seconds');
                    }
                    return;
                }
                
                // Wait for Elementor to be fully ready (if present)
                // Check for Elementor's readiness indicators
                function waitForElementor() {
                    // If Elementor is present, wait for it to finish
                    if (typeof window.elementor !== 'undefined' || typeof window.elementorFrontend !== 'undefined') {
                        // Check if Elementor is ready
                        if (typeof window.elementorFrontend !== 'undefined' && window.elementorFrontend.init) {
                            // Elementor is present but might still be initializing
                            // Wait a bit more for Elementor to complete
                            setTimeout(function() {
                                initializeCouponWidget();
                            }, 200);
                        } else {
                            // Elementor might not be fully loaded yet, wait a bit
                            setTimeout(waitForElementor, 100);
                        }
                    } else {
                        // No Elementor detected, proceed immediately
                        initializeCouponWidget();
                    }
                }
                
                function initializeCouponWidget() {
                    // Widget will automatically initialize from data attributes
                    // The widget script handles this, we just need to ensure it's loaded
                    if (typeof window.CouponWidget !== 'undefined' && window.CouponWidget.initFromAttributes) {
                        console.log('Coupon Dispenser Widget: Ready in container <?php echo esc_js($container_id); ?>');
                    }
                }
                
                // Start waiting for Elementor (if present)
                waitForElementor();
            }
            
            // Start initialization after DOM is ready
            // Use a combination approach: try immediately if ready, otherwise wait
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', function() {
                    // Wait for window.load to ensure all scripts are loaded
                    if (window.addEventListener) {
                        window.addEventListener('load', initWidget);
                    } else {
                        // Fallback for older browsers
                        window.attachEvent('onload', initWidget);
                    }
                });
            } else if (document.readyState === 'interactive' || document.readyState === 'complete') {
                // DOM is ready, but wait for all resources (including scripts)
                if (window.addEventListener) {
                    if (document.readyState === 'complete') {
                        // Already loaded, initialize after a small delay
                        setTimeout(initWidget, 100);
                    } else {
                        window.addEventListener('load', initWidget);
                    }
                } else {
                    window.attachEvent('onload', initWidget);
                }
            }
        })();
        </script>
        <?php
        return ob_get_clean();
    }
}

