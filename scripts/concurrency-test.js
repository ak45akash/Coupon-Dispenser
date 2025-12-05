/**
 * Concurrency Test Script for POST /api/claim
 * 
 * Tests that concurrent claim attempts on the same coupon result in:
 * - Exactly one success (200)
 * - Rest return 409 COUPON_ALREADY_CLAIMED
 * 
 * Usage:
 *   node scripts/concurrency-test.js <base_url> <widget_session_token> <coupon_id> [num_requests]
 * 
 * Example:
 *   node scripts/concurrency-test.js http://localhost:3000 widget_token_here coupon-uuid-here 5
 */

const BASE_URL = process.argv[2] || 'http://localhost:3000'
const WIDGET_SESSION_TOKEN = process.argv[3]
const COUPON_ID = process.argv[4]
const NUM_REQUESTS = parseInt(process.argv[5] || '5', 10)

if (!WIDGET_SESSION_TOKEN || !COUPON_ID) {
  console.error('Usage: node scripts/concurrency-test.js <base_url> <widget_session_token> <coupon_id> [num_requests]')
  console.error('Example: node scripts/concurrency-test.js http://localhost:3000 token_here coupon-uuid-here 5')
  process.exit(1)
}

async function makeClaimRequest(requestId) {
  const startTime = Date.now()
  try {
    const response = await fetch(`${BASE_URL}/api/claim`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${WIDGET_SESSION_TOKEN}`,
      },
      body: JSON.stringify({
        coupon_id: COUPON_ID,
      }),
    })

    const data = await response.json()
    const duration = Date.now() - startTime

    return {
      requestId,
      status: response.status,
      success: data.success,
      error: data.error,
      coupon_code: data.coupon_code,
      duration,
    }
  } catch (error) {
    const duration = Date.now() - startTime
    return {
      requestId,
      status: 'ERROR',
      error: error.message,
      duration,
    }
  }
}

async function runConcurrencyTest() {
  console.log('='.repeat(60))
  console.log('Concurrency Test for POST /api/claim')
  console.log('='.repeat(60))
  console.log(`Base URL: ${BASE_URL}`)
  console.log(`Coupon ID: ${COUPON_ID}`)
  console.log(`Number of concurrent requests: ${NUM_REQUESTS}`)
  console.log('='.repeat(60))
  console.log('')

  console.log('Sending concurrent requests...')
  const startTime = Date.now()

  // Send all requests concurrently
  const requests = Array.from({ length: NUM_REQUESTS }, (_, i) =>
    makeClaimRequest(i + 1)
  )

  const results = await Promise.all(requests)
  const totalDuration = Date.now() - startTime

  // Analyze results
  const successCount = results.filter((r) => r.status === 200).length
  const conflictCount = results.filter((r) => r.status === 409).length
  const errorCount = results.filter((r) => r.status !== 200 && r.status !== 409).length

  console.log('')
  console.log('='.repeat(60))
  console.log('Results')
  console.log('='.repeat(60))
  console.log(`Total requests: ${NUM_REQUESTS}`)
  console.log(`Successful claims (200): ${successCount}`)
  console.log(`Conflicts (409): ${conflictCount}`)
  console.log(`Other errors: ${errorCount}`)
  console.log(`Total duration: ${totalDuration}ms`)
  console.log('')

  // Print detailed results
  console.log('Detailed Results:')
  console.log('-'.repeat(60))
  results.forEach((result) => {
    const statusEmoji = result.status === 200 ? '✅' : result.status === 409 ? '⚠️' : '❌'
    console.log(
      `${statusEmoji} Request ${result.requestId}: ${result.status} - ${result.error || result.coupon_code || 'N/A'} (${result.duration}ms)`
    )
  })
  console.log('')

  // Assertions
  console.log('='.repeat(60))
  console.log('Assertions')
  console.log('='.repeat(60))

  const assertions = {
    exactlyOneSuccess: successCount === 1,
    restAreConflicts: conflictCount === NUM_REQUESTS - 1,
    noOtherErrors: errorCount === 0,
  }

  Object.entries(assertions).forEach(([name, passed]) => {
    const emoji = passed ? '✅' : '❌'
    console.log(`${emoji} ${name}: ${passed ? 'PASS' : 'FAIL'}`)
  })

  console.log('')

  // Final verdict
  const allPassed = Object.values(assertions).every((v) => v)
  if (allPassed) {
    console.log('✅ All assertions passed!')
    process.exit(0)
  } else {
    console.log('❌ Some assertions failed!')
    process.exit(1)
  }
}

// Run the test
runConcurrencyTest().catch((error) => {
  console.error('Test failed with error:', error)
  process.exit(1)
})

