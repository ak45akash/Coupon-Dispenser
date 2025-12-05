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
        register_setting('cdw_settings', 'cdw_vendor_id');
        register_setting('cdw_settings', 'cdw_api_key');
        register_setting('cdw_settings', 'cdw_api_base_url');
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
                
                <table class="form-table" role="presentation">
                    <tr>
                        <th scope="row">
                            <label for="cdw_vendor_id"><?php _e('Vendor ID', 'coupon-dispenser-widget'); ?></label>
                        </th>
                        <td>
                            <input 
                                type="text" 
                                id="cdw_vendor_id" 
                                name="cdw_vendor_id" 
                                value="<?php echo esc_attr(get_option('cdw_vendor_id', '')); ?>" 
                                class="regular-text"
                                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                            />
                            <p class="description">
                                <?php _e('Your vendor ID from the Coupon Dispenser dashboard. Format: UUID.', 'coupon-dispenser-widget'); ?>
                            </p>
                        </td>
                    </tr>
                    
                    <tr>
                        <th scope="row">
                            <label for="cdw_api_key"><?php _e('API Key', 'coupon-dispenser-widget'); ?></label>
                        </th>
                        <td>
                            <input 
                                type="password" 
                                id="cdw_api_key" 
                                name="cdw_api_key" 
                                value="<?php echo esc_attr(get_option('cdw_api_key', '')); ?>" 
                                class="regular-text"
                                placeholder="cdk_..."
                            />
                            <p class="description">
                                <?php _e('Your API key from the Coupon Dispenser dashboard. Keep this secure.', 'coupon-dispenser-widget'); ?>
                            </p>
                        </td>
                    </tr>
                    
                    <tr>
                        <th scope="row">
                            <label for="cdw_api_base_url"><?php _e('API Base URL', 'coupon-dispenser-widget'); ?></label>
                        </th>
                        <td>
                            <input 
                                type="url" 
                                id="cdw_api_base_url" 
                                name="cdw_api_base_url" 
                                value="<?php echo esc_attr(get_option('cdw_api_base_url', 'https://your-domain.com')); ?>" 
                                class="regular-text"
                                placeholder="https://your-domain.com"
                            />
                            <p class="description">
                                <?php _e('Base URL of your Coupon Dispenser platform (e.g., https://your-domain.com).', 'coupon-dispenser-widget'); ?>
                            </p>
                        </td>
                    </tr>
                </table>
                
                <?php submit_button(__('Save Settings', 'coupon-dispenser-widget')); ?>
            </form>
            
            <hr>
            
            <h2><?php _e('Usage', 'coupon-dispenser-widget'); ?></h2>
            <p><?php _e('After configuring your settings, you can embed the coupon widget using the shortcode:', 'coupon-dispenser-widget'); ?></p>
            <code>[coupon_widget]</code>
            
            <h3><?php _e('Shortcode Attributes', 'coupon-dispenser-widget'); ?></h3>
            <ul>
                <li><code>container_id</code> - Optional custom container ID (default: coupon-widget)</li>
            </ul>
            
            <h3><?php _e('Example', 'coupon-dispenser-widget'); ?></h3>
            <code>[coupon_widget container_id="my-coupons"]</code>
        </div>
        <?php
    }
}

