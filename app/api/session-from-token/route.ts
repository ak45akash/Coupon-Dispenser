import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { verifyPartnerToken } from '@/lib/jwt/partner-token'
import { checkJtiReplay } from '@/lib/redis/client'
import { signWidgetSession } from '@/lib/jwt/widget-session'
import { upsertUserFromExternalId } from '@/lib/db/users'

const sessionFromTokenSchema = z.object({
  token: z.string().min(1, 'Token is required'),
})

/**
 * POST /api/session-from-token
 * 
 * Converts a partner-signed JWT token into a widget session token.
 * 
 * Flow:
 * 1. Verify partner token signature using vendor's partner_secret
 * 2. Validate exp, iat claims
 * 3. Check jti replay protection in Redis
 * 4. Upsert user mapping (vendor_id, external_user_id) -> internal user_id
 * 5. Return widget session JWT
 * 
 * This endpoint is idempotent and safe to call multiple times.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = sessionFromTokenSchema.parse(body)

    // Step 1: Verify partner token
    let partnerToken
    try {
      partnerToken = await verifyPartnerToken(validatedData.token)
    } catch (error: any) {
      return NextResponse.json(
        { success: false, error: error.message || 'Invalid partner token' },
        { status: 401 }
      )
    }

    // Step 2: Check jti replay protection
    const tokenExp = partnerToken.exp || 0
    const tokenIat = partnerToken.iat || Math.floor(Date.now() / 1000)
    const tokenTtl = Math.max(0, tokenExp - tokenIat) // TTL in seconds

    // If token has expired, reject it
    if (tokenExp > 0 && tokenExp < Math.floor(Date.now() / 1000)) {
      return NextResponse.json(
        { success: false, error: 'Partner token expired' },
        { status: 401 }
      )
    }

    // Check jti replay
    const isReplay = await checkJtiReplay(partnerToken.jti, tokenTtl)
    if (isReplay) {
      return NextResponse.json(
        { success: false, error: 'JTI_REPLAY' },
        { status: 409 }
      )
    }

    // Step 3: Upsert user mapping
    let internalUserId: string
    try {
      const user = await upsertUserFromExternalId(
        partnerToken.vendor,
        partnerToken.external_user_id
      )
      internalUserId = user.id
    } catch (error: any) {
      console.error('Error upserting user:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to create user mapping' },
        { status: 500 }
      )
    }

    // Step 4: Create and return widget session token
    const widgetSessionToken = signWidgetSession({
      user_id: internalUserId,
      vendor_id: partnerToken.vendor,
    })

    return NextResponse.json({
      success: true,
      data: {
        session_token: widgetSessionToken,
        user_id: internalUserId,
        vendor_id: partnerToken.vendor,
      },
    })
  } catch (error: any) {
    console.error('Error in session-from-token:', error)

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

