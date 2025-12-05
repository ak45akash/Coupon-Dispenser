import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { isSuperAdmin, isPartnerAdmin } from '@/lib/auth/permissions'
import { getVendorById, hasVendorAccess } from '@/lib/db/vendors'
import { supabaseAdmin } from '@/lib/supabase/server'
import crypto from 'crypto'

/**
 * GET /api/vendors/[id]/api-key
 * Get API key for a vendor (masked for security)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    const vendor = await getVendorById(id)

    if (!vendor) {
      return NextResponse.json(
        { success: false, error: 'Vendor not found' },
        { status: 404 }
      )
    }

    // Check permissions: Super admin can access any vendor, partner admin only their own
    if (!isSuperAdmin(session.user.role) && !(isPartnerAdmin(session.user.role) && await hasVendorAccess(session.user.id, id))) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: You do not have access to manage this vendor.' },
        { status: 403 }
      )
    }

    // Safely access api_key field (may not exist if migration hasn't been run)
    const apiKey = (vendor as any)?.api_key || null

    // Return masked key (show last 8 characters)
    const maskedKey = apiKey
      ? `${'*'.repeat(Math.max(0, apiKey.length - 8))}${apiKey.slice(-8)}`
      : null

    return NextResponse.json({
      success: true,
      data: {
        has_key: !!apiKey,
        masked_key: maskedKey,
      },
    })
  } catch (error) {
    console.error('Error fetching API key:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/vendors/[id]/api-key
 * Generate or regenerate API key
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    const vendor = await getVendorById(id)

    if (!vendor) {
      return NextResponse.json(
        { success: false, error: 'Vendor not found' },
        { status: 404 }
      )
    }

    // Check permissions: Super admin can access any vendor, partner admin only their own
    if (!isSuperAdmin(session.user.role) && !(isPartnerAdmin(session.user.role) && await hasVendorAccess(session.user.id, id))) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: You do not have access to manage this vendor.' },
        { status: 403 }
      )
    }

    // Generate secure random API key (32 bytes, base64 encoded, URL-safe)
    // Format: cdk_ followed by 32 random bytes encoded as base64url
    const randomBytes = crypto.randomBytes(32)
    const base64Key = randomBytes.toString('base64')
    // Make it URL-safe and add prefix
    const apiKey = `cdk_${base64Key.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')}`

    // Update vendor with new API key
    // Check if api_key column exists first (graceful handling if migration not run)
    const { error } = await supabaseAdmin
      .from('vendors')
      .update({ api_key: apiKey })
      .eq('id', id)

    if (error) {
      // Check if error is due to missing column
      if (error.message?.includes('column "api_key" does not exist') || error.code === '42703') {
        console.error('Database migration not run: api_key column does not exist')
        return NextResponse.json(
          { 
            success: false, 
            error: 'Database migration required. Please run the migration to add api_key column to vendors table.',
            migration_required: true
          },
          { status: 500 }
        )
      }
      throw error
    }

    return NextResponse.json({
      success: true,
      data: {
        api_key: apiKey,
        message: 'API key generated successfully',
      },
    })
  } catch (error: any) {
    console.error('Error generating API key:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

