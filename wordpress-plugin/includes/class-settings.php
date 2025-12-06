<?php
/**
 * Settings Page Class
 * Handles plugin settings in WordPress admin
 */

if (!defined('ABSPATH')) {
    exit;
}

class Coupon_Dispenser_Settings {
    
    private static $instance = null;
    
    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    private function __construct() {
        add_action('admin_menu', array($this, 'add_settings_page'));
        add_action('admin_init', array($this, 'register_settings'));
        add_action('admin_init', array($this, 'maybe_fix_settings_from_constants'));
    }
    
    /**
     * Auto-fix settings from constants if they're incorrect
     * This helps when plugin was updated with new constants
     */
    public function maybe_fix_settings_from_constants() {
        // Always ensure Vendor ID and API Base URL match constants (they're read-only)
        // Only run once per session to avoid performance issues
        if (get_transient('cdw_settings_fixed')) {
            // Still check read-only fields on every admin load to prevent tampering
            if (defined('CDW_VENDOR_ID') && CDW_VENDOR_ID !== 'PLUGIN_CONFIG_VENDOR_ID') {
                update_option('cdw_vendor_id', CDW_VENDOR_ID);
            }
            if (defined('CDW_API_BASE_URL') && CDW_API_BASE_URL !== 'PLUGIN_CONFIG_API_BASE_URL') {
                update_option('cdw_api_base_url', CDW_API_BASE_URL);
            }
            return;
        }
        
        $fixed = false;
        
        // Fix vendor ID if constant is defined and option is wrong/empty
        if (defined('CDW_VENDOR_ID') && CDW_VENDOR_ID !== 'PLUGIN_CONFIG_VENDOR_ID') {
            $current_value = get_option('cdw_vendor_id', '');
            if (empty($current_value) || $current_value !== CDW_VENDOR_ID) {
                update_option('cdw_vendor_id', CDW_VENDOR_ID);
                $fixed = true;
            }
        }
        
        // Fix API key if constant is defined and option is wrong/empty
        if (defined('CDW_API_KEY') && CDW_API_KEY !== 'PLUGIN_CONFIG_API_KEY') {
            $current_value = get_option('cdw_api_key', '');
            if (empty($current_value) || $current_value !== CDW_API_KEY) {
                update_option('cdw_api_key', CDW_API_KEY);
                $fixed = true;
            }
        }
        
        // Fix API base URL if constant is defined and option is wrong/placeholder
        if (defined('CDW_API_BASE_URL') && CDW_API_BASE_URL !== 'PLUGIN_CONFIG_API_BASE_URL') {
            $current_value = get_option('cdw_api_base_url', '');
            if (empty($current_value) || $current_value === 'https://your-domain.com' || $current_value !== CDW_API_BASE_URL) {
                update_option('cdw_api_base_url', CDW_API_BASE_URL);
                $fixed = true;
            }
        }
        
        // Set transient to avoid running this check repeatedly (expires in 1 hour)
        if ($fixed) {
            set_transient('cdw_settings_fixed', true, HOUR_IN_SECONDS);
        }
    }
    
    /**
     * Add settings page to WordPress admin
     */
    public function add_settings_page() {
        add_options_page(
            __('Coupon Dispenser Settings', 'coupon-dispenser-widget'),
            __('Coupon Dispenser', 'coupon-dispenser-widget'),
            'manage_options',
            'coupon-dispenser-widget',
            array($this, 'render_settings_page')
        );
    }
    
    /**
     * Register plugin settings
     */
    public function register_settings() {
        // Register settings group
        register_setting('cdw_settings', 'cdw_vendor_id', array(
            'type' => 'string',
            'sanitize_callback' => 'sanitize_text_field',
            'default' => ''
        ));
        
        register_setting('cdw_settings', 'cdw_api_key', array(
            'type' => 'string',
            'sanitize_callback' => 'sanitize_text_field',
            'default' => ''
        ));
        
        register_setting('cdw_settings', 'cdw_api_base_url', array(
            'type' => 'string',
            'sanitize_callback' => 'esc_url_raw',
            'default' => ''
        ));
        
        // Add settings section
        add_settings_section(
            'cdw_main_section',
            __('Configuration', 'coupon-dispenser-widget'),
            array($this, 'settings_section_callback'),
            'coupon-dispenser-widget'
        );
        
        // Add settings fields
        add_settings_field(
            'cdw_vendor_id',
            __('Vendor ID', 'coupon-dispenser-widget'),
            array($this, 'render_vendor_id_field'),
            'coupon-dispenser-widget',
            'cdw_main_section'
        );
        
        add_settings_field(
            'cdw_api_key',
            __('API Key', 'coupon-dispenser-widget'),
            array($this, 'render_api_key_field'),
            'coupon-dispenser-widget',
            'cdw_main_section'
        );
        
        add_settings_field(
            'cdw_api_base_url',
            __('API Base URL', 'coupon-dispenser-widget'),
            array($this, 'render_api_base_url_field'),
            'coupon-dispenser-widget',
            'cdw_main_section'
        );
    }
    
    /**
     * Settings section callback
     */
    public function settings_section_callback() {
        echo '<p>' . __('Configure your Coupon Dispenser integration settings below.', 'coupon-dispenser-widget') . '</p>';
    }
    
    /**
     * Render vendor ID field (read-only)
     */
    public function render_vendor_id_field() {
        $value = get_option('cdw_vendor_id', '');
        // Fallback to constant if option is empty
        if (empty($value) && defined('CDW_VENDOR_ID') && CDW_VENDOR_ID !== 'PLUGIN_CONFIG_VENDOR_ID') {
            $value = CDW_VENDOR_ID;
        }
        ?>
        <input 
            type="text" 
            id="cdw_vendor_id" 
            name="cdw_vendor_id" 
            value="<?php echo esc_attr($value); ?>" 
            class="regular-text"
            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            readonly
            style="background-color: #f0f0f1; cursor: not-allowed;"
        />
        <p class="description">
            <?php _e('Your vendor ID from the Coupon Dispenser dashboard. This is pre-configured and cannot be changed.', 'coupon-dispenser-widget'); ?>
        </p>
        <?php
    }
    
    /**
     * Render API key field
     */
    public function render_api_key_field() {
        $api_key = get_option('cdw_api_key', '');
        // Fallback to constant if option is empty
        if (empty($api_key) && defined('CDW_API_KEY') && CDW_API_KEY !== 'PLUGIN_CONFIG_API_KEY') {
            $api_key = CDW_API_KEY;
        }
        $api_key_display = !empty($api_key) ? str_repeat('*', max(20, strlen($api_key) - 8)) . substr($api_key, -8) : '';
        ?>
        <div style="display: flex; gap: 8px; align-items: center;">
            <input 
                type="password" 
                id="cdw_api_key" 
                name="cdw_api_key" 
                value="<?php echo esc_attr($api_key); ?>" 
                class="regular-text"
                placeholder="cdk_..."
                style="flex: 1;"
            />
            <button 
                type="button" 
                class="button" 
                onclick="
                    var input = document.getElementById('cdw_api_key');
                    var btn = this;
                    if (input.type === 'password') {
                        input.type = 'text';
                        btn.textContent = '<?php _e('Hide', 'coupon-dispenser-widget'); ?>';
                    } else {
                        input.type = 'password';
                        btn.textContent = '<?php _e('Show', 'coupon-dispenser-widget'); ?>';
                    }
                "
                style="white-space: nowrap;"
            >
                <?php _e('Show', 'coupon-dispenser-widget'); ?>
            </button>
        </div>
        <p class="description">
            <?php _e('Your API key from the Coupon Dispenser dashboard. You can update this manually if your API key was regenerated. Keep this secure.', 'coupon-dispenser-widget'); ?>
        </p>
        <?php if (!empty($api_key)): ?>
            <p class="description" style="color: #0073aa; margin-top: 5px;">
                <strong><?php _e('Current Key:', 'coupon-dispenser-widget'); ?></strong> 
                <?php echo esc_html($api_key_display); ?>
                <br>
                <em><?php _e('If you regenerated your API key in the dashboard, paste the new key here and save.', 'coupon-dispenser-widget'); ?></em>
            </p>
        <?php endif; ?>
        <?php
    }
    
    /**
     * Render API base URL field (read-only)
     */
    public function render_api_base_url_field() {
        $value = get_option('cdw_api_base_url', '');
        // Fallback to constant if option is empty or placeholder
        if ((empty($value) || $value === 'https://your-domain.com') && defined('CDW_API_BASE_URL') && CDW_API_BASE_URL !== 'PLUGIN_CONFIG_API_BASE_URL') {
            $value = CDW_API_BASE_URL;
        }
        // Default placeholder if still empty
        if (empty($value)) {
            $value = 'https://your-domain.com';
        }
        ?>
        <input 
            type="url" 
            id="cdw_api_base_url" 
            name="cdw_api_base_url" 
            value="<?php echo esc_attr($value); ?>" 
            class="regular-text"
            placeholder="https://your-domain.com"
            readonly
            style="background-color: #f0f0f1; cursor: not-allowed;"
        />
        <p class="description">
            <?php _e('Base URL of your Coupon Dispenser platform. This is automatically configured and cannot be changed.', 'coupon-dispenser-widget'); ?>
        </p>
        <?php
    }
    
    /**
     * Render settings page
     */
    public function render_settings_page() {
        if (!current_user_can('manage_options')) {
            return;
        }
        
        // Check if settings were saved
        if (isset($_GET['settings-updated'])) {
            add_settings_error(
                'cdw_messages',
                'cdw_message',
                __('Settings saved successfully.', 'coupon-dispenser-widget'),
                'success'
            );
        }
        
        settings_errors('cdw_messages');
        ?>
        <div class="wrap">
            <h1><?php echo esc_html(get_admin_page_title()); ?></h1>
            
            <form action="options.php" method="post">
                <?php
                settings_fields('cdw_settings');
                do_settings_sections('cdw_settings');
                ?>
                
                <?php
                // Render settings fields using WordPress Settings API
                do_settings_sections('coupon-dispenser-widget');
                ?>
                
                <?php submit_button(__('Save Settings', 'coupon-dispenser-widget')); ?>
            </form>
            
            <hr>
            
            <h2><?php _e('Usage', 'coupon-dispenser-widget'); ?></h2>
            <p><?php _e('After configuring your settings, you can embed the coupon widget using the shortcode:', 'coupon-dispenser-widget'); ?></p>
            <p style="font-size: 16px; background: #f0f0f1; padding: 10px; border-left: 4px solid #2271b1;">
                <code style="font-size: 16px;">[coupon_widget]</code>
            </p>
            
            <h3><?php _e('Shortcode Attributes', 'coupon-dispenser-widget'); ?></h3>
            <ul>
                <li><code>container_id</code> - Optional custom container ID (default: coupon-widget)</li>
            </ul>
            
            <h3><?php _e('Examples', 'coupon-dispenser-widget'); ?></h3>
            <ul>
                <li><code>[coupon_widget]</code> - Basic usage</li>
                <li><code>[coupon_widget container_id="my-coupons"]</code> - With custom container ID</li>
            </ul>
            
            <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin-top: 20px;">
                <h3 style="margin-top: 0;"><?php _e('Updating API Key', 'coupon-dispenser-widget'); ?></h3>
                <p style="margin-bottom: 0;">
                    <?php _e('If you regenerate your API key in the Coupon Dispenser dashboard, simply paste the new API key in the field above and click "Save Settings". No need to download a new plugin!', 'coupon-dispenser-widget'); ?>
                </p>
            </div>
        </div>
        <?php
    }
}

