/**
 * Automated Widget Flow Test Script
 * 
 * This script tests the complete widget flow as a user would experience it:
 * 1. Widget initialization
 * 2. Token fetching
 * 3. Coupon loading
 * 4. Error handling
 * 
 * Run with: node test-widget-flow.js
 */

const https = require('https');
const http = require('http');

// Configuration - Update these with your actual values
const CONFIG = {
  API_BASE_URL: process.env.API_BASE_URL || 'https://coupon-dispenser.vercel.app',
  VENDOR_ID: process.env.VENDOR_ID || 'YOUR_VENDOR_ID',
  WORDPRESS_SITE: process.env.WORDPRESS_SITE || 'https://cilindia.in',
  TEST_USER_ID: process.env.TEST_USER_ID || '1', // WordPress user ID for testing
};

// Test results
const results = {
  passed: [],
  failed: [],
  warnings: []
};

function log(message, type = 'info') {
  const colors = {
    info: '\x1b[36m',    // Cyan
    success: '\x1b[32m', // Green
    error: '\x1b[31m',   // Red
    warning: '\x1b[33m', // Yellow
    reset: '\x1b[0m'
  };
  console.log(`${colors[type]}${message}${colors.reset}`);
}

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const req = client.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const jsonData = res.statusCode >= 200 && res.statusCode < 300 
            ? JSON.parse(data) 
            : { error: data };
          resolve({ status: res.statusCode, data: jsonData, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: { raw: data }, headers: res.headers });
        }
      });
    });

    req.on('error', reject);
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

async function test(name, testFn) {
  try {
    log(`\n🧪 Testing: ${name}`, 'info');
    await testFn();
    results.passed.push(name);
    log(`✅ PASSED: ${name}`, 'success');
  } catch (error) {
    results.failed.push({ name, error: error.message });
    log(`❌ FAILED: ${name} - ${error.message}`, 'error');
  }
}

async function testWidgetEmbedFile() {
  const url = `${CONFIG.API_BASE_URL}/widget-embed.js`;
  const response = await makeRequest(url);
  
  if (response.status !== 200) {
    throw new Error(`Widget embed file not accessible: ${response.status}`);
  }
  
  if (!response.data.raw || response.data.raw.length < 1000) {
    throw new Error('Widget embed file seems too small or invalid');
  }
  
  // Check for key functions
  const content = response.data.raw;
  if (!content.includes('CouponWidget') || !content.includes('fetchCouponsData')) {
    throw new Error('Widget embed file missing key functions');
  }
}

async function testWordPressPluginEndpoint() {
  const url = `${CONFIG.WORDPRESS_SITE}/wp-json/coupon-dispenser/v1/token`;
  
  // Test without authentication (should return 401)
  const response = await makeRequest(url);
  
  if (response.status === 401) {
    log('  ⚠️  Plugin endpoint returns 401 (expected for unauthenticated requests)', 'warning');
    results.warnings.push('WordPress plugin requires authentication - this is expected');
  } else if (response.status === 200) {
    log('  ℹ️  Plugin endpoint accessible (user might be logged in)', 'info');
  } else {
    throw new Error(`Unexpected status: ${response.status}`);
  }
}

async function testAvailableCouponsEndpoint() {
  const url = `${CONFIG.API_BASE_URL}/api/available-coupons?vendor=${CONFIG.VENDOR_ID}`;
  
  // Test without authentication (should work for public endpoint or return appropriate error)
  const response = await makeRequest(url);
  
  if (response.status === 401) {
    log('  ⚠️  Endpoint requires authentication (expected)', 'warning');
  } else if (response.status === 200) {
    if (response.data.success && Array.isArray(response.data.data?.coupons)) {
      log(`  ✅ Found ${response.data.data.coupons.length} coupons`, 'success');
    }
  } else if (response.status === 404) {
    throw new Error('Vendor not found - check VENDOR_ID');
  } else {
    log(`  ⚠️  Unexpected status: ${response.status}`, 'warning');
  }
}

async function testWidgetSessionEndpoint() {
  // This requires API key, so we'll just check if endpoint exists
  const url = `${CONFIG.API_BASE_URL}/api/widget-session`;
  const response = await makeRequest(url, {
    method: 'POST',
    body: {
      api_key: 'test',
      vendor_id: CONFIG.VENDOR_ID,
      user_id: CONFIG.TEST_USER_ID
    }
  });
  
  // Should return 401 (invalid API key) or 404 (vendor not found), not 500
  if (response.status === 500) {
    throw new Error('Server error - endpoint might be broken');
  }
  
  if (response.status === 401 || response.status === 404) {
    log('  ✅ Endpoint exists and validates input correctly', 'success');
  }
}

async function testCORSHeaders() {
  const url = `${CONFIG.API_BASE_URL}/api/available-coupons?vendor=${CONFIG.VENDOR_ID}`;
  const response = await makeRequest(url, {
    headers: {
      'Origin': CONFIG.WORDPRESS_SITE
    }
  });
  
  const corsHeaders = {
    'access-control-allow-origin': response.headers['access-control-allow-origin'],
    'access-control-allow-methods': response.headers['access-control-allow-methods'],
    'access-control-allow-credentials': response.headers['access-control-allow-credentials']
  };
  
  if (corsHeaders['access-control-allow-origin']) {
    log('  ✅ CORS headers present', 'success');
  } else {
    log('  ⚠️  CORS headers missing (might cause issues from WordPress)', 'warning');
    results.warnings.push('CORS headers might be missing');
  }
}

async function runAllTests() {
  log('🚀 Starting Widget Flow Tests\n', 'info');
  log(`API Base URL: ${CONFIG.API_BASE_URL}`, 'info');
  log(`WordPress Site: ${CONFIG.WORDPRESS_SITE}`, 'info');
  log(`Vendor ID: ${CONFIG.VENDOR_ID}`, 'info');
  
  await test('Widget Embed File Accessibility', testWidgetEmbedFile);
  await test('WordPress Plugin Endpoint', testWordPressPluginEndpoint);
  await test('Available Coupons Endpoint', testAvailableCouponsEndpoint);
  await test('Widget Session Endpoint', testWidgetSessionEndpoint);
  await test('CORS Headers', testCORSHeaders);
  
  // Print summary
  log('\n' + '='.repeat(50), 'info');
  log('📊 Test Summary', 'info');
  log(`✅ Passed: ${results.passed.length}`, 'success');
  log(`❌ Failed: ${results.failed.length}`, results.failed.length > 0 ? 'error' : 'success');
  log(`⚠️  Warnings: ${results.warnings.length}`, results.warnings.length > 0 ? 'warning' : 'info');
  
  if (results.failed.length > 0) {
    log('\n❌ Failed Tests:', 'error');
    results.failed.forEach(({ name, error }) => {
      log(`  - ${name}: ${error}`, 'error');
    });
  }
  
  if (results.warnings.length > 0) {
    log('\n⚠️  Warnings:', 'warning');
    results.warnings.forEach(warning => {
      log(`  - ${warning}`, 'warning');
    });
  }
  
  log('\n' + '='.repeat(50), 'info');
  
  return results.failed.length === 0;
}

// Run tests
if (require.main === module) {
  runAllTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      log(`\n💥 Fatal error: ${error.message}`, 'error');
      process.exit(1);
    });
}

module.exports = { runAllTests, test, makeRequest };

