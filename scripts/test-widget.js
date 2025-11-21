/**
 * Test Widget Script
 * 
 * This script helps you test the widget by:
 * 1. Getting a vendor ID from the database
 * 2. Creating a test coupon if needed
 * 3. Getting a test user ID
 * 
 * Run: node scripts/test-widget.js
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Try to load .env.local or .env
function loadEnv() {
  const envFiles = ['.env.local', '.env']
  for (const file of envFiles) {
    const envPath = path.join(process.cwd(), file)
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8')
      envContent.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/)
        if (match) {
          const key = match[1].trim()
          const value = match[2].trim().replace(/^["']|["']$/g, '')
          if (!process.env[key]) {
            process.env[key] = value
          }
        }
      })
      break
    }
  }
}

loadEnv()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testWidget() {
  try {
    console.log('🔍 Finding vendors and coupons...\n')

    // Get all active vendors
    const { data: vendors, error: vendorsError } = await supabase
      .from('vendors')
      .select('id, name, description, website, logo_url, active')
      .is('deleted_at', null)
      .eq('active', true)
      .limit(5)

    if (vendorsError) throw vendorsError

    if (!vendors || vendors.length === 0) {
      console.log('❌ No vendors found. Please create a vendor first in the dashboard.')
      return
    }

    console.log('✅ Found vendors:\n')
    vendors.forEach((vendor, index) => {
      console.log(`${index + 1}. ${vendor.name}`)
      console.log(`   ID: ${vendor.id}`)
      console.log(`   Website: ${vendor.website || 'N/A'}`)
      console.log('')
    })

    // Get coupons for the first vendor
    const firstVendor = vendors[0]
    console.log(`📋 Checking coupons for "${firstVendor.name}"...\n`)

    const { data: coupons, error: couponsError } = await supabase
      .from('coupons')
      .select('id, code, description, discount_value, is_claimed')
      .eq('vendor_id', firstVendor.id)
      .is('deleted_at', null)
      .eq('is_claimed', false)
      .limit(10)

    if (couponsError) throw couponsError

    const availableCoupons = coupons || []
    console.log(`✅ Found ${availableCoupons.length} available coupon(s):\n`)

    if (availableCoupons.length === 0) {
      console.log('⚠️  No unclaimed coupons found. Creating a test coupon...\n')
      
      // Create a test coupon
      const { data: users } = await supabase
        .from('users')
        .select('id')
        .limit(1)

      const createdBy = users && users.length > 0 ? users[0].id : null

      const { data: newCoupon, error: createError } = await supabase
        .from('coupons')
        .insert({
          vendor_id: firstVendor.id,
          code: `TEST${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
          description: 'Test coupon for widget testing',
          discount_value: '20% off',
          is_claimed: false,
          created_by: createdBy,
        })
        .select()
        .single()

      if (createError) throw createError

      console.log(`✅ Created test coupon: ${newCoupon.code}\n`)
      availableCoupons.push(newCoupon)
    } else {
      availableCoupons.forEach((coupon, index) => {
        console.log(`${index + 1}. ${coupon.code} - ${coupon.description || 'No description'}`)
        console.log(`   Discount: ${coupon.discount_value || 'N/A'}`)
        console.log('')
      })
    }

    // Get a test user
    const { data: users } = await supabase
      .from('users')
      .select('id, email, role')
      .is('deleted_at', null)
      .limit(1)

    const testUser = users && users.length > 0 ? users[0] : null

    console.log('📝 Widget Test Configuration:\n')
    console.log('Copy this HTML to test the widget:\n')
    console.log('─'.repeat(60))
    console.log(`<script src="http://localhost:3000/widget-embed.js"></script>`)
    console.log(`<div id="coupon-widget"`)
    console.log(`     data-vendor-id="${firstVendor.id}"`)
    if (testUser) {
      console.log(`     data-user-id="${testUser.id}">`)
    } else {
      console.log(`     data-user-id="YOUR_USER_ID">`)
    }
    console.log(`</div>`)
    console.log('─'.repeat(60))
    console.log('')

    console.log('📋 Test Details:')
    console.log(`   Vendor ID: ${firstVendor.id}`)
    console.log(`   Vendor Name: ${firstVendor.name}`)
    if (testUser) {
      console.log(`   Test User ID: ${testUser.id}`)
      console.log(`   Test User Email: ${testUser.email}`)
    } else {
      console.log(`   ⚠️  No users found. You'll need to provide a user ID.`)
    }
    console.log(`   Available Coupons: ${availableCoupons.length}`)
    console.log('')

    console.log('🌐 Test URLs:')
    console.log(`   Demo Page: http://localhost:3000/widget-demo.html`)
    console.log(`   API Test: http://localhost:3000/api/widget/coupons?vendor_id=${firstVendor.id}`)
    console.log('')

    console.log('✅ Ready to test! Replace YOUR_VENDOR_ID in the demo page with:')
    console.log(`   ${firstVendor.id}`)
    console.log('')

  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

testWidget()

