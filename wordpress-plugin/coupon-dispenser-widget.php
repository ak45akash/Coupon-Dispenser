<?php
/**
 * Plugin Name: Coupon Dispenser Widget
 * Plugin URI: https://iakash.dev
 * Description: Embed coupon widgets from Coupon Dispenser platform. Zero-code integration for WordPress.
 * Version: 1.0.0
 * Author: Akash
 * Author URI: https://iakash.dev
 * Text Domain: coupon-dispenser-widget
 * Domain Path: /languages
 * Requires at least: 5.0
 * Requires PHP: 7.4
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

// Plugin constants
define('CDW_VERSION', '1.0.0');
define('CDW_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('CDW_PLUGIN_URL', plugin_dir_url(__FILE__));
define('CDW_PLUGIN_BASENAME', plugin_basename(__FILE__));

// Vendor configuration (pre-configured from dashboard)
// These values are set during plugin ZIP generation
// PLUGIN_CONFIG_VENDOR_ID and PLUGIN_CONFIG_API_KEY are replaced during ZIP generation
if (!defined('CDW_VENDOR_ID')) {
    define('CDW_VENDOR_ID', get_option('cdw_vendor_id', 'PLUGIN_CONFIG_VENDOR_ID'));
}
if (!defined('CDW_API_KEY')) {
    define('CDW_API_KEY', get_option('cdw_api_key', 'PLUGIN_CONFIG_API_KEY'));
}
if (!defined('CDW_API_BASE_URL')) {
    define('CDW_API_BASE_URL', get_option('cdw_api_base_url', 'PLUGIN_CONFIG_API_BASE_URL'));
}

/**
 * Main plugin class
 */
class Coupon_Dispenser_Widget {
    
    private static $instance = null;
    
    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    private function __construct() {
        // Include required files early
        $this->includes();
        
        // Initialize plugin
        add_action('plugins_loaded', array($this, 'init'));
        
        // Register shortcode on 'init' to ensure it's available early
        add_action('init', array($this, 'register_shortcode'), 10);
    }
    
    public function init() {
        // Load plugin textdomain for translations
        load_plugin_textdomain('coupon-dispenser-widget', false, dirname(CDW_PLUGIN_BASENAME) . '/languages');
        
        // Initialize components
        $this->init_components();
    }
    
    private function includes() {
        require_once CDW_PLUGIN_DIR . 'includes/class-settings.php';
        require_once CDW_PLUGIN_DIR . 'includes/class-shortcode.php';
        require_once CDW_PLUGIN_DIR . 'includes/class-widget-render.php';
    }
    
    /**
     * Register shortcode early on 'init' action
     */
    public function register_shortcode() {
        Coupon_Dispenser_Shortcode::get_instance();
    }
    
    private function init_components() {
        // Initialize settings page
        if (is_admin()) {
            Coupon_Dispenser_Settings::get_instance();
        }
        
        // Enqueue scripts
        add_action('wp_enqueue_scripts', array($this, 'enqueue_scripts'));
        
        // Register REST API endpoint for widget session token
        add_action('rest_api_init', array($this, 'register_rest_routes'));
    }
    
    /**
     * Enqueue widget script on frontend
     */
    public function enqueue_scripts() {
        // Get API base URL from options (settings override constants)
        $api_base_url = get_option('cdw_api_base_url', '');
        if (empty($api_base_url) && defined('CDW_API_BASE_URL') && CDW_API_BASE_URL !== 'PLUGIN_CONFIG_API_BASE_URL') {
            $api_base_url = CDW_API_BASE_URL;
        }
        
        if (empty($api_base_url)) {
            return; // Don't enqueue if not configured
        }
        
        $widget_script_url = $api_base_url . '/widget-embed.js';
        
        // Enqueue widget script
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
    }
    
    /**
     * Register REST API routes
     */
    public function register_rest_routes() {
        register_rest_route('coupon-dispenser/v1', '/token', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_widget_session_token'),
            'permission_callback' => array($this, 'check_rest_permission'), // Custom permission check
        ));
    }
    
    /**
     * Permission callback for REST API
     * Allows both logged-in and anonymous users
     */
    public function check_rest_permission() {
        // Always allow - we handle user detection in the callback
        return true;
    }
    
    /**
     * Generate widget session token via API key method
     * Called by widget to authenticate WordPress users (or anonymous users)
     */
    public function get_widget_session_token($request) {
        try {
            // Ensure WordPress is loaded properly for authentication
            if (!function_exists('is_user_logged_in')) {
                return new WP_Error(
                    'wordpress_not_loaded',
                    'WordPress authentication not available',
                    array('status' => 500)
                );
            }
            
            // Get vendor ID and API key from options (settings override constants)
            // Options are checked first to allow manual updates via settings page
            $vendor_id = get_option('cdw_vendor_id', '');
            $api_key = get_option('cdw_api_key', '');
            
            // Fallback to constants ONLY if options are truly empty (not manually set)
            if (empty($vendor_id) && defined('CDW_VENDOR_ID') && CDW_VENDOR_ID !== 'PLUGIN_CONFIG_VENDOR_ID') {
                $vendor_id = CDW_VENDOR_ID;
            }
            // For API key, only use constant if option is empty (allows manual updates)
            if (empty($api_key) && defined('CDW_API_KEY') && CDW_API_KEY !== 'PLUGIN_CONFIG_API_KEY') {
                $api_key = CDW_API_KEY;
            }
            
            // Validate configuration
            if (empty($vendor_id) || empty($api_key)) {
                error_log('Coupon Dispenser Plugin: Missing vendor_id or api_key. Vendor ID: ' . (!empty($vendor_id) ? 'set' : 'empty') . ', API Key: ' . (!empty($api_key) ? 'set' : 'empty'));
                return new WP_Error(
                    'not_configured',
                    'Plugin is not configured. Please set vendor ID and API key in settings.',
                    array('status' => 500)
                );
            }
            
            // Try to determine user ID - check if user is logged in
            // Note: REST API calls need cookies for authentication
            $user_id = null;
            
            // Check if user is logged in (requires WordPress cookie authentication)
            if (is_user_logged_in()) {
                // Use WordPress user ID for logged-in users
                $user_id = (string) get_current_user_id();
            } else {
                // For anonymous users, generate or use existing anonymous ID
                $anonymous_id = $request->get_param('anonymous_id');
                if (empty($anonymous_id)) {
                    // Check for existing anonymous ID cookie
                    if (isset($_COOKIE['cdw_anon_id']) && !empty($_COOKIE['cdw_anon_id'])) {
                        $anonymous_id = sanitize_text_field($_COOKIE['cdw_anon_id']);
                    } else {
                        // Generate a new anonymous ID
                        $anonymous_id = 'anon_' . wp_generate_password(16, false);
                        // Set cookie for 30 days to maintain consistency
                        // Use httponly=false so JavaScript can access it if needed
                        setcookie('cdw_anon_id', $anonymous_id, time() + (30 * DAY_IN_SECONDS), '/', '', is_ssl(), false);
                        $_COOKIE['cdw_anon_id'] = $anonymous_id;
                    }
                }
                $user_id = $anonymous_id;
            }
            
            if (empty($user_id)) {
                return new WP_Error(
                    'user_id_required',
                    'Unable to determine user identifier',
                    array('status' => 400)
                );
            }
            
            // Get API base URL from options (settings override constants)
            $api_base_url = get_option('cdw_api_base_url', '');
            if (empty($api_base_url) && defined('CDW_API_BASE_URL') && CDW_API_BASE_URL !== 'PLUGIN_CONFIG_API_BASE_URL') {
                $api_base_url = CDW_API_BASE_URL;
            }
            
            // Fallback to default if still empty
            if (empty($api_base_url)) {
                $api_base_url = 'https://coupon-dispenser.vercel.app';
            }
            
            // Remove trailing slash
            $api_base_url = rtrim($api_base_url, '/');
            
            // Call our API to get widget session token
            $api_url = $api_base_url . '/api/widget-session';
            
            error_log('Coupon Dispenser Plugin: Calling API: ' . $api_url);
            error_log('Coupon Dispenser Plugin: Vendor ID: ' . $vendor_id);
            error_log('Coupon Dispenser Plugin: API Key (first 10 chars): ' . substr($api_key, 0, 10) . '...');
            error_log('Coupon Dispenser Plugin: User ID: ' . $user_id);
            
            $response = wp_remote_post($api_url, array(
                'headers' => array(
                    'Content-Type' => 'application/json',
                ),
                'body' => json_encode(array(
                    'api_key' => $api_key,
                    'vendor_id' => $vendor_id,
                    'user_id' => (string)$user_id,
                )),
                'timeout' => 10,
            ));
            
            if (is_wp_error($response)) {
                error_log('Coupon Dispenser Plugin: WP_Error: ' . $response->get_error_message());
                return new WP_Error(
                    'api_error',
                    'Failed to connect to Coupon Dispenser API: ' . $response->get_error_message(),
                    array('status' => 500)
                );
            }
            
            $response_code = wp_remote_retrieve_response_code($response);
            $response_body = wp_remote_retrieve_body($response);
            $data = json_decode($response_body, true);
            
            error_log('Coupon Dispenser Plugin: API Response Code: ' . $response_code);
            error_log('Coupon Dispenser Plugin: API Response Body: ' . substr($response_body, 0, 500));
            
            if ($response_code !== 200) {
                // Log the error for debugging
                error_log('Coupon Dispenser Plugin: API Error - Status: ' . $response_code . ', Response: ' . $response_body);
                
                $error_message = isset($data['error']) ? $data['error'] : 'Failed to generate widget session token';
                
                // Provide more helpful error messages
                if ($response_code === 401) {
                    $error_message = isset($data['error']) ? $data['error'] : 'Invalid API key or vendor ID. Please check your plugin settings.';
                } elseif ($response_code === 404) {
                    $error_message = 'Vendor not found. Please verify your vendor ID in plugin settings.';
                }
                
                return new WP_Error(
                    'api_error',
                    $error_message,
                    array('status' => $response_code)
                );
            }
            
            if (!isset($data['success']) || !$data['success']) {
                error_log('Coupon Dispenser Plugin: API returned success=false');
                return new WP_Error(
                    'api_error',
                    isset($data['error']) ? $data['error'] : 'Failed to generate widget session token',
                    array('status' => 500)
                );
            }
            
            if (!isset($data['data']['session_token'])) {
                error_log('Coupon Dispenser Plugin: Missing session_token in API response');
                return new WP_Error(
                    'api_error',
                    'Invalid API response: session_token not found',
                    array('status' => 500)
                );
            }
            
            // Return widget session token
            return rest_ensure_response(array(
                'token' => $data['data']['session_token'],
            ));
            
        } catch (Exception $e) {
            // Log the exception for debugging
            error_log('Coupon Dispenser Plugin Exception: ' . $e->getMessage());
            error_log('Coupon Dispenser Plugin Stack Trace: ' . $e->getTraceAsString());
            
            return new WP_Error(
                'internal_error',
                'An internal error occurred: ' . $e->getMessage(),
                array('status' => 500)
            );
        }
    }
}

/**
 * Initialize plugin
 */
function coupon_dispenser_widget_init() {
    return Coupon_Dispenser_Widget::get_instance();
}

// Start the plugin immediately to ensure early initialization
coupon_dispenser_widget_init();

/**
 * Activation hook
 */
register_activation_hook(__FILE__, 'cdw_activate');
function cdw_activate() {
    // Force update options from constants (pre-configured from dashboard)
    // This ensures values are always set correctly, even if they were previously set incorrectly
    if (defined('CDW_VENDOR_ID') && CDW_VENDOR_ID !== 'PLUGIN_CONFIG_VENDOR_ID') {
        update_option('cdw_vendor_id', CDW_VENDOR_ID);
    }
    if (defined('CDW_API_KEY') && CDW_API_KEY !== 'PLUGIN_CONFIG_API_KEY') {
        update_option('cdw_api_key', CDW_API_KEY);
    }
    if (defined('CDW_API_BASE_URL') && CDW_API_BASE_URL !== 'PLUGIN_CONFIG_API_BASE_URL') {
        update_option('cdw_api_base_url', CDW_API_BASE_URL);
    }
}

/**
 * Deactivation hook
 */
register_deactivation_hook(__FILE__, 'cdw_deactivate');
function cdw_deactivate() {
    // Cleanup if needed
}

