/**
 * Tests for WordPress Plugin Structure and Content
 * Validates plugin files, shortcode registration, and integration points
 */

import { promises as fs } from 'fs'
import path from 'path'

describe('WordPress Plugin Structure', () => {
  const pluginDir = path.join(process.cwd(), 'wordpress-plugin')

  describe('Plugin Files Existence', () => {
    it('should have main plugin file', async () => {
      const mainFile = path.join(pluginDir, 'coupon-dispenser-widget.php')
      await expect(fs.access(mainFile)).resolves.not.toThrow()
    })

    it('should have settings class file', async () => {
      const settingsFile = path.join(pluginDir, 'includes', 'class-settings.php')
      await expect(fs.access(settingsFile)).resolves.not.toThrow()
    })

    it('should have shortcode class file', async () => {
      const shortcodeFile = path.join(pluginDir, 'includes', 'class-shortcode.php')
      await expect(fs.access(shortcodeFile)).resolves.not.toThrow()
    })

    it('should have widget render class file', async () => {
      const widgetRenderFile = path.join(pluginDir, 'includes', 'class-widget-render.php')
      await expect(fs.access(widgetRenderFile)).resolves.not.toThrow()
    })
  })

  describe('Main Plugin File Content', () => {
    let mainPluginContent: string

    beforeAll(async () => {
      const mainFile = path.join(pluginDir, 'coupon-dispenser-widget.php')
      mainPluginContent = await fs.readFile(mainFile, 'utf-8')
    })

    it('should have plugin header', () => {
      expect(mainPluginContent).toContain('Plugin Name:')
      expect(mainPluginContent).toContain('Plugin URI:')
      expect(mainPluginContent).toContain('Version:')
      expect(mainPluginContent).toContain('Author:')
      expect(mainPluginContent).toContain('iakash.dev')
    })

    it('should contain placeholder strings for replacement', () => {
      expect(mainPluginContent).toContain('PLUGIN_CONFIG_VENDOR_ID')
      expect(mainPluginContent).toContain('PLUGIN_CONFIG_API_KEY')
      expect(mainPluginContent).toContain('PLUGIN_CONFIG_API_BASE_URL')
    })

    it('should register shortcode on init action', () => {
      expect(mainPluginContent).toMatch(/add_action\s*\(\s*['"]init['"]\s*,/)
      expect(mainPluginContent).toContain('register_shortcode')
    })

    it('should initialize plugin immediately', () => {
      // Should call coupon_dispenser_widget_init() directly (not on plugins_loaded)
      expect(mainPluginContent).toMatch(/coupon_dispenser_widget_init\s*\(\)/)
    })

    it('should register REST API route', () => {
      expect(mainPluginContent).toContain('register_rest_route')
      expect(mainPluginContent).toContain('coupon-dispenser/v1')
      expect(mainPluginContent).toContain('/token')
    })

    it('should have widget session token generation method', () => {
      expect(mainPluginContent).toContain('get_widget_session_token')
      expect(mainPluginContent).toContain('/api/widget-session')
    })

    it('should read from WordPress options with fallback to constants', () => {
      expect(mainPluginContent).toContain('get_option')
      expect(mainPluginContent).toContain('cdw_vendor_id')
      expect(mainPluginContent).toContain('cdw_api_key')
      expect(mainPluginContent).toContain('cdw_api_base_url')
    })
  })

  describe('Shortcode Class Content', () => {
    let shortcodeContent: string

    beforeAll(async () => {
      const shortcodeFile = path.join(pluginDir, 'includes', 'class-shortcode.php')
      shortcodeContent = await fs.readFile(shortcodeFile, 'utf-8')
    })

    it('should register coupon_widget shortcode', () => {
      expect(shortcodeContent).toContain("add_shortcode('coupon_widget'")
      expect(shortcodeContent).toContain('render_shortcode')
    })

    it('should check for duplicate shortcode registration', () => {
      expect(shortcodeContent).toContain('shortcode_exists')
    })

    it('should validate configuration', () => {
      expect(shortcodeContent).toContain('cdw_vendor_id')
      expect(shortcodeContent).toContain('cdw_api_key')
      expect(shortcodeContent).toContain('cdw_api_base_url')
    })

    it('should display error messages with settings link', () => {
      expect(shortcodeContent).toContain('admin_url')
      expect(shortcodeContent).toContain('options-general.php?page=coupon-dispenser-widget')
    })

    it('should enqueue widget script', () => {
      expect(shortcodeContent).toContain('wp_enqueue_script')
      expect(shortcodeContent).toContain('coupon-dispenser-widget')
    })

    it('should use REST API endpoint for token', () => {
      expect(shortcodeContent).toContain('rest_url')
      expect(shortcodeContent).toContain('coupon-dispenser/v1/token')
    })

    it('should render widget container with data attributes', () => {
      expect(shortcodeContent).toContain('data-vendor-id')
      expect(shortcodeContent).toContain('data-api-key-endpoint')
      expect(shortcodeContent).toContain('coupon-dispenser-widget-container')
    })
  })

  describe('Settings Class Content', () => {
    let settingsContent: string

    beforeAll(async () => {
      const settingsFile = path.join(pluginDir, 'includes', 'class-settings.php')
      settingsContent = await fs.readFile(settingsFile, 'utf-8')
    })

    it('should add settings page to WordPress admin', () => {
      expect(settingsContent).toContain('add_options_page')
      expect(settingsContent).toContain('Coupon Dispenser')
    })

    it('should register settings using WordPress Settings API', () => {
      expect(settingsContent).toContain('register_setting')
      expect(settingsContent).toContain('cdw_settings')
      expect(settingsContent).toContain('add_settings_section')
      expect(settingsContent).toContain('add_settings_field')
    })

    it('should register all three settings fields', () => {
      expect(settingsContent).toContain('cdw_vendor_id')
      expect(settingsContent).toContain('cdw_api_key')
      expect(settingsContent).toContain('cdw_api_base_url')
    })

    it('should have Show/Hide toggle for API key', () => {
      expect(settingsContent).toContain('type="password"')
      expect(settingsContent).toContain('Show')
      expect(settingsContent).toContain('Hide')
    })

    it('should display masked API key', () => {
      expect(settingsContent).toContain('Current Key:')
      expect(settingsContent).toMatch(/str_repeat.*\*.*substr/)
    })

    it('should have proper sanitization callbacks', () => {
      expect(settingsContent).toContain('sanitize_text_field')
      expect(settingsContent).toContain('esc_url_raw')
    })

    it('should include usage instructions', () => {
      expect(settingsContent).toContain('[coupon_widget]')
      expect(settingsContent).toContain('Usage')
    })
  })

  describe('Plugin Integration Points', () => {
    it('should use correct REST API endpoint path', async () => {
      const mainFile = path.join(pluginDir, 'coupon-dispenser-widget.php')
      const content = await fs.readFile(mainFile, 'utf-8')
      
      // Should call /api/widget-session endpoint
      expect(content).toMatch(/\/api\/widget-session/)
    })

    it('should handle WordPress user ID for widget session', async () => {
      const mainFile = path.join(pluginDir, 'coupon-dispenser-widget.php')
      const content = await fs.readFile(mainFile, 'utf-8')
      
      expect(content).toContain('get_current_user_id')
      expect(content).toContain('is_user_logged_in')
    })

    it('should return proper JSON response format', async () => {
      const mainFile = path.join(pluginDir, 'coupon-dispenser-widget.php')
      const content = await fs.readFile(mainFile, 'utf-8')
      
      expect(content).toContain('rest_ensure_response')
      expect(content).toContain('session_token')
    })
  })

  describe('Plugin Security', () => {
    it('should check ABSPATH in all PHP files', async () => {
      const files = [
        'coupon-dispenser-widget.php',
        'includes/class-settings.php',
        'includes/class-shortcode.php',
        'includes/class-widget-render.php',
      ]

      for (const file of files) {
        const filePath = path.join(pluginDir, file)
        const content = await fs.readFile(filePath, 'utf-8')
        expect(content).toContain("if (!defined('ABSPATH'))")
        expect(content).toContain('exit;')
      }
    })

    it('should escape output properly', async () => {
      const shortcodeFile = path.join(pluginDir, 'includes', 'class-shortcode.php')
      const content = await fs.readFile(shortcodeFile, 'utf-8')
      
      expect(content).toContain('esc_attr')
      expect(content).toContain('esc_js')
      expect(content).toContain('esc_html')
    })
  })
})

