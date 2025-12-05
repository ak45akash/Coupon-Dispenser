import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { canManageVendors, isSuperAdmin, isPartnerAdmin } from '@/lib/auth/permissions'
import { getVendorById, updateVendor, hasVendorAccess } from '@/lib/db/vendors'
import { supabaseAdmin } from '@/lib/supabase/server'
import crypto from 'crypto'

/**
 * GET /api/vendors/[id]/partner-secret
 * Get partner secret for a vendor (masked for security)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
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
    if (isSuperAdmin(session.user.role)) {
      // Super admin has access to all vendors
    } else if (isPartnerAdmin(session.user.role)) {
      // Partner admin can only access their assigned vendor
      const hasAccess = await hasVendorAccess(session.user.id, id)
      if (!hasAccess) {
        return NextResponse.json(
          { success: false, error: 'You do not have access to this vendor' },
          { status: 403 }
        )
      }
    } else {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      )
    }

    const partnerSecret = (vendor as any).partner_secret

    // Return masked secret (show last 4 characters)
    const maskedSecret = partnerSecret
      ? `${'*'.repeat(Math.max(0, partnerSecret.length - 4))}${partnerSecret.slice(-4)}`
      : null

    return NextResponse.json({
      success: true,
      data: {
        has_secret: !!partnerSecret,
        masked_secret: maskedSecret,
      },
    })
  } catch (error) {
    console.error('Error fetching partner secret:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/vendors/[id]/partner-secret
 * Generate or regenerate partner secret
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
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
    if (isSuperAdmin(session.user.role)) {
      // Super admin has access to all vendors
    } else if (isPartnerAdmin(session.user.role)) {
      // Partner admin can only access their assigned vendor
      const hasAccess = await hasVendorAccess(session.user.id, id)
      if (!hasAccess) {
        return NextResponse.json(
          { success: false, error: 'You do not have access to this vendor' },
          { status: 403 }
        )
      }
    } else {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Generate secure random secret (32 bytes, base64 encoded)
    const newSecret = crypto.randomBytes(32).toString('base64')

    // Update vendor with new partner_secret
    const { error } = await supabaseAdmin
      .from('vendors')
      .update({ partner_secret: newSecret })
      .eq('id', id)

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      data: {
        partner_secret: newSecret,
        message: 'Partner secret generated successfully',
      },
    })
  } catch (error: any) {
    console.error('Error generating partner secret:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

