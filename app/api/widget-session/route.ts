import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getVendorById } from '@/lib/db/vendors'
import { upsertUserFromExternalId } from '@/lib/db/users'
import { signWidgetSession } from '@/lib/jwt/widget-session'
import { supabaseAdmin } from '@/lib/supabase/server'

const widgetSessionSchema = z.object({
  api_key: z.string().min(1, 'API key is required'),
  vendor_id: z.string().uuid('Invalid vendor ID format'),
  user_id: z.string().min(1, 'User ID is required').optional(),
  user_email: z.string().email('Invalid email format').optional(),
}).refine(
  (data) => data.user_id || data.user_email,
  {
    message: 'Either user_id or user_email is required',
    path: ['user_id'],
  }
)

/**
 * POST /api/widget-session
 * 
 * Creates a widget session token using API key authentication.
 * This is the simple method for non-technical partners.
 * 
 * Flow:
 * 1. Validate API key against vendor
 * 2. Map partner's user_id/user_email to internal user_id
 * 3. Create and return widget session token
 * 
 * This endpoint is simpler than JWT method - partners don't need to sign tokens.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = widgetSessionSchema.parse(body)

    // Step 1: Validate API key
    const vendor = await getVendorById(validatedData.vendor_id)
    
    if (!vendor) {
      return NextResponse.json(
        { success: false, error: 'Vendor not found' },
        { status: 404 }
      )
    }

    // Safely access api_key field (may not exist if migration hasn't been run)
    const vendorApiKey = (vendor as any)?.api_key || null
    
    if (!vendorApiKey) {
      return NextResponse.json(
        { success: false, error: 'Vendor does not have API key configured. Please generate an API key first.' },
        { status: 400 }
      )
    }

    if (vendorApiKey !== validatedData.api_key) {
      return NextResponse.json(
        { success: false, error: 'Invalid API key' },
        { status: 401 }
      )
    }

    // Step 2: Get external user identifier
    let externalUserId: string
    
    if (validatedData.user_id) {
      externalUserId = validatedData.user_id
    } else if (validatedData.user_email) {
      // For email, we'll use email as the external_user_id
      // This allows partners to use email directly without needing user IDs
      externalUserId = validatedData.user_email
    } else {
      return NextResponse.json(
        { success: false, error: 'Either user_id or user_email is required' },
        { status: 400 }
      )
    }

    // Step 3: Upsert user mapping (same as JWT method)
    let internalUserId: string
    try {
      const user = await upsertUserFromExternalId(
        validatedData.vendor_id,
        externalUserId
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
      vendor_id: validatedData.vendor_id,
    })

    return NextResponse.json({
      success: true,
      data: {
        session_token: widgetSessionToken,
        user_id: internalUserId,
        vendor_id: validatedData.vendor_id,
      },
    })
  } catch (error: any) {
    console.error('Error in widget-session endpoint:', error)

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

