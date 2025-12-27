<?php
/**
 * Plugin Name: Coupon Dispenser Widget
 * Plugin URI: https://iakash.dev
 * Description: Embed coupon widgets from Coupon Dispenser platform. Zero-code integration for WordPress.
 * Version: 1.1.2
 * Author: Akash
 * Author URI: https://iakash.dev
 * Text Domain: coupon-dispenser-widget
 * Domain Path: /languages
 * Requires at least: 5.0
 * Requires PHP: 7.4
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 */

// ABSOLUTE MINIMUM TEST - Write to file with absolute path
// This MUST work if the file is being loaded at all
$test_file_abs = __DIR__ . DIRECTORY_SEPARATOR . 'plugin-load-test.txt';
$test_msg = date('Y-m-d H:i:s') . " - FILE LOADED\n";
file_put_contents($test_file_abs, $test_msg);

// Exit if accessed directly
if (!defined('ABSPATH')) {
    $exit_msg = date('Y-m-d H:i:s') . " - ABSPATH not defined, exiting\n";
    file_put_contents($test_file_abs, $exit_msg, FILE_APPEND);
    exit;
}

$continue_msg = date('Y-m-d H:i:s') . " - ABSPATH defined, continuing\n";
file_put_contents($test_file_abs, $continue_msg, FILE_APPEND);

// IMMEDIATE TEST - Log before any constants are defined
file_put_contents($test_file_abs, date('Y-m-d H:i:s') . " - Before constants\n", FILE_APPEND);

if (function_exists('error_log')) {
    error_log('[CouponDispenser] Plugin file coupon-dispenser-widget.php is being loaded');
    file_put_contents($test_file_abs, date('Y-m-d H:i:s') . " - error_log() function exists\n", FILE_APPEND);
} else {
    file_put_contents($test_file_abs, date('Y-m-d H:i:s') . " - error_log() function NOT available\n", FILE_APPEND);
}

// Plugin constants
define('CDW_VERSION', '1.1.2');
define('CDW_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('CDW_PLUGIN_URL', plugin_dir_url(__FILE__));
define('CDW_PLUGIN_BASENAME', plugin_basename(__FILE__));

// Vendor configuration (pre-configured from dashboard)
// These values are set during plugin ZIP generation
// PLUGIN_CONFIG_VENDOR_ID and PLUGIN_CONFIG_API_KEY are replaced during ZIP generation
// Note: We don't use get_option() here to avoid caching issues - constants are only used as fallback
if (!defined('CDW_VENDOR_ID')) {
    define('CDW_VENDOR_ID', 'PLUGIN_CONFIG_VENDOR_ID');
}
if (!defined('CDW_API_KEY')) {
    define('CDW_API_KEY', 'PLUGIN_CONFIG_API_KEY');
}
if (!defined('CDW_API_BASE_URL')) {
    define('CDW_API_BASE_URL', 'PLUGIN_CONFIG_API_BASE_URL');
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
        error_log('[CouponDispenser] Coupon_Dispenser_Widget constructor called');
        $test_file_abs = __DIR__ . DIRECTORY_SEPARATOR . 'plugin-load-test.txt';
        file_put_contents($test_file_abs, date('Y-m-d H:i:s') . " - Coupon_Dispenser_Widget constructor called\n", FILE_APPEND);
        
        // Include required files early
        $this->includes();
        file_put_contents($test_file_abs, date('Y-m-d H:i:s') . " - includes() completed\n", FILE_APPEND);
        
        // Initialize plugin
        add_action('plugins_loaded', array($this, 'init'));
        
        // Register shortcode on 'init' to ensure it's available early
        add_action('init', array($this, 'register_shortcode'), 10);
        file_put_contents($test_file_abs, date('Y-m-d H:i:s') . " - Actions registered\n", FILE_APPEND);
        
        // Debug: Log plugin initialization
        error_log('[CouponDispenser] Plugin initialized - Version: ' . CDW_VERSION);
    }
    
    public function init() {
        error_log('[CouponDispenser] init() method called');
        $test_file_abs = __DIR__ . DIRECTORY_SEPARATOR . 'plugin-load-test.txt';
        file_put_contents($test_file_abs, date('Y-m-d H:i:s') . " - init() method called\n", FILE_APPEND);
        
        // Load plugin textdomain for translations
        load_plugin_textdomain('coupon-dispenser-widget', false, dirname(CDW_PLUGIN_BASENAME) . '/languages');
        
        // Initialize components
        $this->init_components();
        file_put_contents($test_file_abs, date('Y-m-d H:i:s') . " - init_components() completed\n", FILE_APPEND);
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
        error_log('[CouponDispenser] register_shortcode() method called');
        Coupon_Dispenser_Shortcode::get_instance();
        error_log('[CouponDispenser] Shortcode registration complete');
    }
    
    private function init_components() {
        error_log('[CouponDispenser] init_components() method called');
        $test_file_abs = __DIR__ . DIRECTORY_SEPARATOR . 'plugin-load-test.txt';
        file_put_contents($test_file_abs, date('Y-m-d H:i:s') . " - init_components() called\n", FILE_APPEND);
        
        // Initialize settings page
        if (is_admin()) {
            Coupon_Dispenser_Settings::get_instance();
        }
        
        // Note: REST API nonce bypass is registered on rest_api_init (after REST API is loaded).
        // See register_rest_auth_bypass().
        
        // Enqueue scripts
        add_action('wp_enqueue_scripts', array($this, 'enqueue_scripts'), 20);
        file_put_contents($test_file_abs, date('Y-m-d H:i:s') . " - wp_enqueue_scripts action registered\n", FILE_APPEND);
        
        // Register REST API endpoint for widget session token + nonce bypass filter
        add_action('rest_api_init', array($this, 'register_rest_routes'));
        add_action('rest_api_init', array($this, 'register_rest_auth_bypass'));
        file_put_contents($test_file_abs, date('Y-m-d H:i:s') . " - rest_api_init action registered\n", FILE_APPEND);
    }
    
    /**
     * Get or create a per-site secret used to derive a stable, pseudonymous user_ref.
     * This avoids sending raw user IDs to the backend and is GDPR-friendly.
     *
     * IMPORTANT: This value must remain stable over time for monthly claim enforcement.
     *
     * @return string
     */
    private function get_or_create_user_ref_secret() {
        $secret = get_option('cdw_user_ref_secret', '');
        $secret = is_string($secret) ? trim($secret) : '';

        if (!empty($secret)) {
            return $secret;
        }

        // Generate a strong random secret
        try {
            $secret = bin2hex(random_bytes(32)); // 64 hex chars
        } catch (Throwable $e) {
            // Fallback if random_bytes is unavailable
            $secret = wp_generate_password(64, true, true);
        }

        update_option('cdw_user_ref_secret', $secret);
        return $secret;
    }

    /**
     * Compute a stable pseudonymous user_ref (vendor-scoped by WordPress site) for a logged-in WP user.
     *
     * @param int $wp_user_id
     * @return string
     */
    private function compute_user_ref($wp_user_id) {
        $wp_user_id = (int) $wp_user_id;
        $secret = $this->get_or_create_user_ref_secret();
        return hash_hmac('sha256', (string) $wp_user_id, $secret);
    }

    /**
     * Ensure WordPress authenticates users in REST API context
     * This filter ensures get_current_user_id() works properly
     * WordPress handles cookie authentication automatically - we just ensure it runs
     */
    public function rest_api_authenticate_user($user_id) {
        // If user is already authenticated, return it
        if ($user_id) {
            return $user_id;
        }
        
        // Only process REST API requests for our endpoint
        if (!defined('REST_REQUEST') || !REST_REQUEST) {
            return $user_id;
        }
        
        // Check if this is our plugin's REST endpoint
        $request_uri = isset($_SERVER['REQUEST_URI']) ? $_SERVER['REQUEST_URI'] : '';
        if (strpos($request_uri, '/wp-json/coupon-dispenser/') === false) {
            return $user_id;
        }
        
        // WordPress automatically authenticates from cookies via determine_current_user
        // We just need to ensure the user is loaded. WordPress handles this internally.
        // If cookies are present, WordPress will authenticate automatically.
        // get_current_user_id() will then work correctly.
        
        return $user_id;
    }
    
    /**
     * Enqueue widget script on frontend
     */
    public function enqueue_scripts() {
        error_log('[CouponDispenser] enqueue_scripts() method called');
        
        // Get API base URL from options (settings override constants)
        $api_base_url = get_option('cdw_api_base_url', '');
        $api_base_url = trim((string)$api_base_url);
        
        if (empty($api_base_url) && defined('CDW_API_BASE_URL') && CDW_API_BASE_URL !== 'PLUGIN_CONFIG_API_BASE_URL') {
            $api_base_url = trim((string)CDW_API_BASE_URL);
        }
        
        // Auto-fix: If it's a preview URL (contains preview deployment pattern), change to production
        if (!empty($api_base_url) && strpos($api_base_url, 'coupon-dispenser-') !== false && strpos($api_base_url, '-akashdeep-kanchas-projects.vercel.app') !== false) {
            error_log('[CouponDispenser] Auto-fixing preview URL to production URL in enqueue_scripts');
            $api_base_url = 'https://coupon-dispenser.vercel.app';
            update_option('cdw_api_base_url', $api_base_url);
        }
        
        error_log('[CouponDispenser] API Base URL: ' . ($api_base_url ?: 'EMPTY') . ' (length: ' . strlen($api_base_url) . ')');
        
        // More lenient validation - just check if it's not empty and not the placeholder
        if (empty($api_base_url) || $api_base_url === 'https://your-domain.com' || strlen($api_base_url) < 10) {
            error_log('[CouponDispenser] WARNING: API Base URL is empty or invalid. Value: "' . $api_base_url . '". Script will not be enqueued.');
            return; // Don't enqueue if not configured
        }
        
        $widget_script_url = $api_base_url . '/widget-embed.js';
        
        error_log('[CouponDispenser] Enqueuing script: ' . $widget_script_url);
        
        // Enqueue widget script
        wp_enqueue_script(
            'coupon-dispenser-widget',
            $widget_script_url,
            array('jquery'), // Depend on jQuery
            CDW_VERSION,
            true // Load in footer
        );
        
        // OPTION A: No nonce is required for our token endpoint (we bypass REST nonce for that route).
        // Localize script to expose API URL only.
        wp_localize_script('coupon-dispenser-widget', 'couponDispenserWidget', array(
            'apiUrl' => $api_base_url,
            'restUrl' => rest_url('coupon-dispenser/v1/token'),
        ));
        
        // Add inline script to configure API base URL
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
        
        error_log('[CouponDispenser] Script enqueued successfully');
    }
    
    /**
     * Register REST API routes
     */
    public function register_rest_routes() {
        register_rest_route('coupon-dispenser/v1', '/token', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_widget_session_token'),
            'permission_callback' => '__return_true', // Allow all requests - we authenticate manually inside
        ));
        
        // Debug endpoint (remove in production)
        register_rest_route('coupon-dispenser/v1', '/debug', array(
            'methods' => 'GET',
            'callback' => array($this, 'debug_config'),
            'permission_callback' => '__return_true',
        ));
    }
    
    /**
     * Register REST API authentication bypass filter.
     * Must be registered on rest_api_init.
     */
    public function register_rest_auth_bypass() {
        add_filter('rest_authentication_errors', array($this, 'bypass_rest_nonce_for_token_endpoint'), 10, 1);
    }

    /**
     * Bypass REST API nonce requirement for our token endpoint
     * WordPress REST API requires nonce for cookie auth, but external widget can't provide it
     * We authenticate manually inside the endpoint using is_user_logged_in()
     */
    public function bypass_rest_nonce_for_token_endpoint($result) {
        // If previous filters already returned an error, don't override it
        if (is_wp_error($result)) {
            return $result;
        }

        // Only process REST API requests
        if (!defined('REST_REQUEST') || !REST_REQUEST) {
            return $result;
        }

        $request_uri = isset($_SERVER['REQUEST_URI']) ? $_SERVER['REQUEST_URI'] : '';
        if (empty($request_uri)) {
            return $result;
        }

        // ONLY bypass for our token endpoint
        $token_endpoint = '/wp-json/coupon-dispenser/v1/token';
        if (strpos($request_uri, $token_endpoint) !== false) {
            // Return null to bypass nonce requirement - we authenticate manually in callback
            return null;
        }

        return $result;
    }
    
    /**
     * Debug endpoint to check configuration
     */
    public function debug_config($request) {
        $vendor_id_option = get_option('cdw_vendor_id', 'NOT_SET');
        $api_key_option = get_option('cdw_api_key', 'NOT_SET');
        
        return rest_ensure_response(array(
            'vendor_id' => array(
                'option' => $vendor_id_option,
                'length' => strlen($vendor_id_option),
                'constant_defined' => defined('CDW_VENDOR_ID'),
                'constant_value' => defined('CDW_VENDOR_ID') ? CDW_VENDOR_ID : 'NOT_DEFINED',
            ),
            'api_key' => array(
                'option_first_10' => substr($api_key_option, 0, 10),
                'option_length' => strlen($api_key_option),
                'constant_defined' => defined('CDW_API_KEY'),
                'constant_first_10' => defined('CDW_API_KEY') ? substr(CDW_API_KEY, 0, 10) : 'NOT_DEFINED',
            ),
            'api_base_url' => array(
                'option' => get_option('cdw_api_base_url', 'NOT_SET'),
                'constant_defined' => defined('CDW_API_BASE_URL'),
                'constant_value' => defined('CDW_API_BASE_URL') ? CDW_API_BASE_URL : 'NOT_DEFINED',
            ),
        ));
    }
    
    /**
     * Generate widget session token via API key method
     * Called by widget to authenticate WordPress users (or anonymous users)
     */
    public function get_widget_session_token($request) {
        // Set error handler to catch all PHP errors
        set_error_handler(function($errno, $errstr, $errfile, $errline) {
            error_log('Coupon Dispenser Plugin PHP Error: ' . $errstr . ' in ' . $errfile . ' on line ' . $errline);
            return false; // Don't prevent default error handling
        }, E_ALL);
        
        try {
            // Ensure WordPress is loaded properly for authentication
            if (!function_exists('is_user_logged_in')) {
                restore_error_handler();
                return new WP_Error(
                    'wordpress_not_loaded',
                    'WordPress authentication not available',
                    array('status' => 500)
                );
            }
            
            // Get vendor ID and API key from options (settings override constants)
            // ALWAYS prioritize options over constants to allow manual updates
            $vendor_id = get_option('cdw_vendor_id', '');
            $api_key = get_option('cdw_api_key', '');
            
            // Trim whitespace to ensure empty check works correctly
            $vendor_id = trim((string)$vendor_id);
            $api_key = trim((string)$api_key);
            
            // Log what we retrieved (for debugging)
            error_log('Coupon Dispenser Plugin: Retrieved from options - Vendor ID: ' . (!empty($vendor_id) ? substr($vendor_id, 0, 8) . '...' : 'empty') . ', API Key: ' . (!empty($api_key) ? substr($api_key, 0, 10) . '...' : 'empty'));
            
            // Fallback to constants ONLY if options are truly empty
            if (empty($vendor_id) && defined('CDW_VENDOR_ID') && CDW_VENDOR_ID !== 'PLUGIN_CONFIG_VENDOR_ID') {
                $vendor_id = trim((string)CDW_VENDOR_ID);
                error_log('Coupon Dispenser Plugin: Using Vendor ID from constant fallback');
            }
            // For API key, only use constant if option is completely empty (allows manual updates)
            if (empty($api_key) && defined('CDW_API_KEY') && CDW_API_KEY !== 'PLUGIN_CONFIG_API_KEY') {
                $api_key = trim((string)CDW_API_KEY);
                error_log('Coupon Dispenser Plugin: Using API Key from constant fallback');
            }
            
            // Validate configuration
            if (empty($vendor_id) || empty($api_key)) {
                error_log('Coupon Dispenser Plugin ERROR: Missing vendor_id or api_key.');
                error_log('  Vendor ID length: ' . strlen($vendor_id));
                error_log('  API Key length: ' . strlen($api_key));
                error_log('  Vendor ID option value: "' . get_option('cdw_vendor_id', 'NOT_SET') . '"');
                error_log('  API Key option value (first 10): "' . substr(get_option('cdw_api_key', 'NOT_SET'), 0, 10) . '"');
                error_log('  Vendor ID constant: ' . (defined('CDW_VENDOR_ID') ? CDW_VENDOR_ID : 'NOT_DEFINED'));
                error_log('  API Key constant (first 10): ' . (defined('CDW_API_KEY') ? substr(CDW_API_KEY, 0, 10) : 'NOT_DEFINED'));
                
                return new WP_Error(
                    'not_configured',
                    'Plugin is not configured. Please set vendor ID and API key in WordPress Settings → Coupon Dispenser Widget. Current API Key option length: ' . strlen($api_key) . ', Constant defined: ' . (defined('CDW_API_KEY') ? 'yes' : 'no'),
                    array('status' => 500)
                );
            }
            
            /**
             * IMPORTANT HOSTING QUIRK HANDLING:
             * Some hosts/security plugins disable WordPress's cookie->user resolution specifically for REST requests.
             * We do NOT read cookies in JS. We also avoid custom cookie parsing in PHP.
             * Instead, we ensure WordPress core cookie auth callback is available and then prime the current user.
             */
            if (function_exists('wp_validate_auth_cookie') && !has_filter('determine_current_user', 'wp_validate_auth_cookie')) {
                // Re-add core cookie validator ONLY if something removed it.
                add_filter('determine_current_user', 'wp_validate_auth_cookie', 20);
                error_log('Coupon Dispenser Plugin: Re-added wp_validate_auth_cookie to determine_current_user (was missing).');
            }

            // Prime current user from cookies (if available)
            if (function_exists('wp_get_current_user')) {
                wp_get_current_user();
            }

            // REQUIRE logged-in users - anonymous users are not allowed
            // We authenticate manually here since we bypassed REST nonce requirement
            // WordPress cookies are sent automatically by browser with credentials: 'include'
            if (!is_user_logged_in()) {
                $has_cookie = (isset($_COOKIE) && is_array($_COOKIE) && !empty($_COOKIE));
                error_log('Coupon Dispenser Plugin: User is not logged in (is_user_logged_in() returned false). Cookies present: ' . ($has_cookie ? 'yes' : 'no'));
                return new WP_Error(
                    'authentication_required',
                    'You must be logged in to view and claim coupons. Please log in to your account.',
                    array('status' => 401)
                );
            }
            
            // Get user ID - this works because we're authenticated via cookies
            $user_id = get_current_user_id();
            
            // get_current_user_id() returns 0 if user is not logged in
            if ($user_id === 0) {
                error_log('Coupon Dispenser Plugin: User is not logged in (get_current_user_id() returned 0).');
                return new WP_Error(
                    'authentication_required',
                    'You must be logged in to view and claim coupons. Please log in to your account.',
                    array('status' => 401)
                );
            }
            
            // Compute stable pseudonymous user_ref (GDPR-friendly) and use it for backend identity.
            // This prevents exposing raw WordPress user IDs and remains stable across devices/browsers.
            $user_ref = $this->compute_user_ref((int) $user_id);
            error_log('Coupon Dispenser Plugin: Using pseudonymous user_ref (first 12): ' . substr($user_ref, 0, 12) . '...');
            
            // Get API base URL from options (settings override constants)
            $api_base_url = get_option('cdw_api_base_url', '');
            $api_base_url = trim((string)$api_base_url);
            
            // Fallback to constant if option is empty
            if (empty($api_base_url) && defined('CDW_API_BASE_URL') && CDW_API_BASE_URL !== 'PLUGIN_CONFIG_API_BASE_URL') {
                $api_base_url = trim((string)CDW_API_BASE_URL);
            }
            
            // Remove placeholder values
            if ($api_base_url === 'PLUGIN_CONFIG_API_BASE_URL' || $api_base_url === 'https://your-domain.com') {
                $api_base_url = '';
            }
            
            // Fallback to default if still empty
            if (empty($api_base_url)) {
                $api_base_url = 'https://coupon-dispenser.vercel.app';
                error_log('Coupon Dispenser Plugin: Using default API base URL: ' . $api_base_url);
            }
            
            // Remove trailing slash
            $api_base_url = rtrim($api_base_url, '/');
            
            error_log('Coupon Dispenser Plugin: Final API Base URL: ' . $api_base_url);
            
            // Call our API to get widget session token
            $api_url = $api_base_url . '/api/widget-session';
            
            error_log('Coupon Dispenser Plugin: Calling API: ' . $api_url);
            error_log('Coupon Dispenser Plugin: Vendor ID: ' . $vendor_id);
            error_log('Coupon Dispenser Plugin: API Key (first 10 chars): ' . substr($api_key, 0, 10) . '...');
            error_log('Coupon Dispenser Plugin: user_ref (first 12): ' . substr($user_ref, 0, 12) . '...');
            
            $response = wp_remote_post($api_url, array(
                'headers' => array(
                    'Content-Type' => 'application/json',
                ),
                'body' => json_encode(array(
                    'api_key' => $api_key,
                    'vendor_id' => $vendor_id,
                    // NOTE: For GDPR, we send a pseudonymous user_ref as user_id.
                    'user_id' => (string) $user_ref,
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
            
            restore_error_handler();
            return new WP_Error(
                'internal_error',
                'An internal error occurred: ' . $e->getMessage(),
                array('status' => 500)
            );
        } catch (Error $e) {
            // Catch PHP 7+ errors (ParseError, TypeError, etc.)
            error_log('Coupon Dispenser Plugin PHP Error: ' . $e->getMessage());
            error_log('Coupon Dispenser Plugin Stack Trace: ' . $e->getTraceAsString());
            
            restore_error_handler();
            return new WP_Error(
                'internal_error',
                'A PHP error occurred: ' . $e->getMessage(),
                array('status' => 500)
            );
        } finally {
            restore_error_handler();
        }
    }
}

/**
 * Initialize plugin
 */
function coupon_dispenser_widget_init() {
    // Write to test file immediately
    $test_file_abs = __DIR__ . DIRECTORY_SEPARATOR . 'plugin-load-test.txt';
    file_put_contents($test_file_abs, date('Y-m-d H:i:s') . " - coupon_dispenser_widget_init() called\n", FILE_APPEND);
    
    // IMMEDIATE LOG - This runs as soon as plugin file is loaded
    // Use file_put_contents as backup in case error_log is disabled
    $log_locations = array(
        dirname(__FILE__) . '/plugin-debug.log',
        dirname(dirname(__FILE__)) . '/coupon-dispenser-debug.log',
    );
    
    if (defined('WP_CONTENT_DIR')) {
        $log_locations[] = WP_CONTENT_DIR . '/coupon-dispenser-debug.log';
    }
    
    $log_msg = date('Y-m-d H:i:s') . " [CouponDispenser] PLUGIN FILE LOADED - Version: " . CDW_VERSION . "\n";
    foreach ($log_locations as $log_file) {
        @file_put_contents($log_file, $log_msg, FILE_APPEND);
    }
    
    error_log('[CouponDispenser] ============================================');
    error_log('[CouponDispenser] PLUGIN FILE LOADED');
    error_log('[CouponDispenser] Plugin version: ' . CDW_VERSION);
    error_log('[CouponDispenser] Plugin directory: ' . CDW_PLUGIN_DIR);
    error_log('[CouponDispenser] ============================================');
    
    $test_file_abs = __DIR__ . DIRECTORY_SEPARATOR . 'plugin-load-test.txt';
    file_put_contents($test_file_abs, date('Y-m-d H:i:s') . " - About to create Coupon_Dispenser_Widget instance\n", FILE_APPEND);
    
    try {
        $instance = Coupon_Dispenser_Widget::get_instance();
        file_put_contents($test_file_abs, date('Y-m-d H:i:s') . " - Instance created successfully\n", FILE_APPEND);
        return $instance;
    } catch (Exception $e) {
        error_log('[CouponDispenser] FATAL ERROR: ' . $e->getMessage());
        error_log('[CouponDispenser] Stack trace: ' . $e->getTraceAsString());
        file_put_contents($test_file_abs, date('Y-m-d H:i:s') . " - FATAL ERROR: " . $e->getMessage() . "\n", FILE_APPEND);
        foreach ($log_locations as $log_file) {
            file_put_contents($log_file, date('Y-m-d H:i:s') . " [CouponDispenser] FATAL ERROR: " . $e->getMessage() . "\n", FILE_APPEND);
        }
        return null;
    } catch (Throwable $e) {
        // Catch PHP 7+ fatal errors (Throwable works in PHP 7.0+, Error in PHP 7.0+)
        error_log('[CouponDispenser] FATAL ERROR: ' . $e->getMessage());
        $error_msg = date('Y-m-d H:i:s') . " - FATAL PHP ERROR: " . $e->getMessage() . "\n";
        file_put_contents($test_file_abs, $error_msg, FILE_APPEND);
        foreach ($log_locations as $log_file) {
            $log_msg = date('Y-m-d H:i:s') . " [CouponDispenser] FATAL PHP ERROR: " . $e->getMessage() . "\n";
            file_put_contents($log_file, $log_msg, FILE_APPEND);
        }
        return null;
    }
}

// Start the plugin immediately to ensure early initialization
// Wrap in try-catch to prevent fatal errors from breaking the site
$test_file_abs = __DIR__ . DIRECTORY_SEPARATOR . 'plugin-load-test.txt';
file_put_contents($test_file_abs, date('Y-m-d H:i:s') . " - About to call coupon_dispenser_widget_init()\n", FILE_APPEND);

try {
    coupon_dispenser_widget_init();
    file_put_contents($test_file_abs, date('Y-m-d H:i:s') . " - coupon_dispenser_widget_init() completed\n", FILE_APPEND);
} catch (Exception $e) {
    error_log('[CouponDispenser] CRITICAL: Plugin initialization failed: ' . $e->getMessage());
    file_put_contents($test_file_abs, date('Y-m-d H:i:s') . " - EXCEPTION: " . $e->getMessage() . "\n", FILE_APPEND);
    $log_locations = array(
        __DIR__ . DIRECTORY_SEPARATOR . 'plugin-debug.log',
        dirname(__DIR__) . DIRECTORY_SEPARATOR . 'coupon-dispenser-debug.log',
    );
    if (defined('WP_CONTENT_DIR')) {
        $log_locations[] = WP_CONTENT_DIR . DIRECTORY_SEPARATOR . 'coupon-dispenser-debug.log';
    }
    foreach ($log_locations as $log_file) {
        file_put_contents($log_file, date('Y-m-d H:i:s') . " [CouponDispenser] CRITICAL ERROR: " . $e->getMessage() . "\n", FILE_APPEND);
    }
} catch (Throwable $e) {
    // Catch PHP 7+ fatal errors (Throwable works in PHP 7.0+, Error in PHP 7.0+)
    error_log('[CouponDispenser] CRITICAL PHP ERROR: ' . $e->getMessage());
    $error_msg = date('Y-m-d H:i:s') . " - PHP ERROR: " . $e->getMessage() . "\n";
    file_put_contents($test_file_abs, $error_msg, FILE_APPEND);
    $log_locations = array(
        __DIR__ . DIRECTORY_SEPARATOR . 'plugin-debug.log',
        dirname(__DIR__) . DIRECTORY_SEPARATOR . 'coupon-dispenser-debug.log',
    );
    if (defined('WP_CONTENT_DIR')) {
        $log_locations[] = WP_CONTENT_DIR . DIRECTORY_SEPARATOR . 'coupon-dispenser-debug.log';
    }
    foreach ($log_locations as $log_file) {
        $log_msg = date('Y-m-d H:i:s') . " [CouponDispenser] CRITICAL PHP ERROR: " . $e->getMessage() . "\n";
        file_put_contents($log_file, $log_msg, FILE_APPEND);
    }
}

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

