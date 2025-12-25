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

    // Helper function to check if user ID is anonymous
    const isAnonymousUserId = (id: string): boolean => {
      return id.startsWith('anon_') || id.startsWith('anonymous-')
    }

    // Step 3: Handle user mapping
    // For anonymous users, use the anonymous ID directly (don't create database user)
    // For real users, upsert user mapping
    let internalUserId: string
    const isAnonymous = isAnonymousUserId(externalUserId)
    
    if (isAnonymous) {
      // For anonymous users, use the anonymous ID directly in the session token
      // This avoids creating database users for anonymous visitors
      internalUserId = externalUserId
      console.log(`[widget-session] Using anonymous user ID directly: ${internalUserId.substring(0, 20)}...`)
    } else {
      // For real users, create/retrieve user mapping
      try {
        const user = await upsertUserFromExternalId(
          validatedData.vendor_id,
          externalUserId
        )
        internalUserId = user.id
        console.log(`[widget-session] Created/retrieved user mapping: ${internalUserId}`)
      } catch (error: any) {
        console.error('[widget-session] Error upserting user:', {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          externalUserId: externalUserId.substring(0, 20) + '...',
        })
        
        // Return detailed error for API debugging
        const errorMessage = `Failed to create user mapping: ${error?.message || error?.toString()}`
        const isDevelopment = process.env.NODE_ENV === 'development'
        
        return NextResponse.json(
          { 
            success: false, 
            error: errorMessage,
            ...(isDevelopment && { details: error?.stack })
          },
          { status: 500 }
        )
      }
    }

    // Step 4: Create and return widget session token
    let widgetSessionToken: string
    try {
      widgetSessionToken = signWidgetSession({
        user_id: internalUserId,
        vendor_id: validatedData.vendor_id,
      })
    } catch (error: any) {
      console.error('Error signing widget session token:', error)
      console.error('Error stack:', error?.stack)
      console.error('Error message:', error?.message)
      
      // Return detailed error for API debugging
      const errorMessage = `Failed to create session token: ${error?.message || error?.toString()}`
      const isDevelopment = process.env.NODE_ENV === 'development'
      
      return NextResponse.json(
        { 
          success: false, 
          error: errorMessage,
          ...(isDevelopment && { details: error?.stack })
        },
        { status: 500 }
      )
    }

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
    console.error('Error stack:', error?.stack)
    console.error('Error message:', error?.message)

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    // For API endpoints, return more helpful error messages even in production
    // This helps partners debug integration issues
    const errorMessage = error?.message || error?.toString() || 'Internal server error'
    
    // Only include stack traces in development
    const isDevelopment = process.env.NODE_ENV === 'development'
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        ...(isDevelopment && { details: error?.stack })
      },
      { status: 500 }
    )
  }
}

