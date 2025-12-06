#!/usr/bin/env node
/**
 * Manual verification script for WordPress plugin
 * Run with: node scripts/verify-plugin.js
 */

const fs = require('fs').promises
const path = require('path')

const pluginDir = path.join(process.cwd(), 'wordpress-plugin')

const checks = {
  passed: 0,
  failed: 0,
  errors: [],
}

function log(message, type = 'info') {
  const prefix = {
    pass: '✅',
    fail: '❌',
    info: 'ℹ️ ',
    warn: '⚠️ ',
  }[type] || '  '
  console.log(`${prefix} ${message}`)
}

async function checkFileExists(filePath, description) {
  try {
    await fs.access(filePath)
    log(`${description}: EXISTS`, 'pass')
    checks.passed++
    return true
  } catch (error) {
    log(`${description}: MISSING (${filePath})`, 'fail')
    checks.failed++
    checks.errors.push(`Missing file: ${filePath}`)
    return false
  }
}

async function checkFileContains(filePath, searchText, description) {
  try {
    const content = await fs.readFile(filePath, 'utf-8')
    if (content.includes(searchText)) {
      log(`${description}: FOUND`, 'pass')
      checks.passed++
      return true
    } else {
      log(`${description}: NOT FOUND`, 'fail')
      checks.failed++
      checks.errors.push(`${description} not found in ${filePath}`)
      return false
    }
  } catch (error) {
    log(`${description}: ERROR - ${error.message}`, 'fail')
    checks.failed++
    checks.errors.push(`Error reading ${filePath}: ${error.message}`)
    return false
  }
}

async function verifyPlugin() {
  console.log('\n🔍 WordPress Plugin Verification\n')
  console.log('='.repeat(60))

  // Check files exist
  console.log('\n📁 File Existence Checks:')
  await checkFileExists(
    path.join(pluginDir, 'coupon-dispenser-widget.php'),
    'Main plugin file'
  )
  await checkFileExists(
    path.join(pluginDir, 'includes/class-settings.php'),
    'Settings class'
  )
  await checkFileExists(
    path.join(pluginDir, 'includes/class-shortcode.php'),
    'Shortcode class'
  )
  await checkFileExists(
    path.join(pluginDir, 'includes/class-widget-render.php'),
    'Widget render class'
  )

  // Check main plugin file
  const mainFile = path.join(pluginDir, 'coupon-dispenser-widget.php')
  console.log('\n🔧 Main Plugin File Checks:')
  await checkFileContains(mainFile, 'Plugin Name:', 'Plugin header')
  await checkFileContains(mainFile, 'iakash.dev', 'Author URI')
  await checkFileContains(mainFile, 'PLUGIN_CONFIG_VENDOR_ID', 'Vendor ID placeholder')
  await checkFileContains(mainFile, 'PLUGIN_CONFIG_API_KEY', 'API Key placeholder')
  await checkFileContains(mainFile, 'PLUGIN_CONFIG_API_BASE_URL', 'API Base URL placeholder')
  await checkFileContains(mainFile, "add_action('init'", 'Init action hook')
  await checkFileContains(mainFile, 'register_shortcode', 'Shortcode registration')
  await checkFileContains(mainFile, 'register_rest_route', 'REST API registration')
  await checkFileContains(mainFile, '/api/widget-session', 'Widget session endpoint')

  // Check shortcode class
  const shortcodeFile = path.join(pluginDir, 'includes/class-shortcode.php')
  console.log('\n📝 Shortcode Class Checks:')
  await checkFileContains(shortcodeFile, "add_shortcode('coupon_widget'", 'Shortcode registration')
  await checkFileContains(shortcodeFile, 'shortcode_exists', 'Duplicate check')
  await checkFileContains(shortcodeFile, 'cdw_api_key', 'API key validation')
  await checkFileContains(shortcodeFile, 'data-api-key-endpoint', 'Data attribute')

  // Check settings class
  const settingsFile = path.join(pluginDir, 'includes/class-settings.php')
  console.log('\n⚙️  Settings Class Checks:')
  await checkFileContains(settingsFile, 'add_options_page', 'Settings page registration')
  await checkFileContains(settingsFile, 'register_setting', 'Settings registration')
  await checkFileContains(settingsFile, 'add_settings_section', 'Settings section')
  await checkFileContains(settingsFile, 'cdw_api_key', 'API key field')
  await checkFileContains(settingsFile, 'type="password"', 'Password input type')
  await checkFileContains(settingsFile, 'Show', 'Show/Hide toggle')

  // Security checks
  console.log('\n🔒 Security Checks:')
  const files = [
    'coupon-dispenser-widget.php',
    'includes/class-settings.php',
    'includes/class-shortcode.php',
    'includes/class-widget-render.php',
  ]
  for (const file of files) {
    const filePath = path.join(pluginDir, file)
    await checkFileContains(filePath, "if (!defined('ABSPATH'))", `ABSPATH check in ${file}`)
  }

  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('\n📊 Summary:')
  console.log(`   Passed: ${checks.passed}`)
  console.log(`   Failed: ${checks.failed}`)
  console.log(`   Total:  ${checks.passed + checks.failed}`)

  if (checks.errors.length > 0) {
    console.log('\n❌ Errors:')
    checks.errors.forEach((error, index) => {
      console.log(`   ${index + 1}. ${error}`)
    })
    process.exit(1)
  } else {
    console.log('\n✅ All checks passed!')
    process.exit(0)
  }
}

verifyPlugin().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})

