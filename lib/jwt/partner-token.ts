import jwt from 'jsonwebtoken'
import { getVendorById } from '@/lib/db/vendors'

export interface PartnerTokenPayload {
  vendor: string // vendor_id
  external_user_id: string
  jti: string // JWT ID for replay protection
  iat?: number
  exp?: number
}

/**
 * Verify a partner-signed JWT token
 * Uses HS256 with vendor's partner_secret
 */
export async function verifyPartnerToken(token: string): Promise<PartnerTokenPayload> {
  // Decode without verification first to get vendor_id
  const decoded = jwt.decode(token) as PartnerTokenPayload | null
  if (!decoded || !decoded.vendor) {
    throw new Error('Invalid token: missing vendor claim')
  }

  // Get vendor to retrieve partner_secret
  const vendor = await getVendorById(decoded.vendor)
  if (!vendor) {
    throw new Error('Vendor not found')
  }

  // Check if vendor has partner_secret
  const partnerSecret = (vendor as any).partner_secret
  if (!partnerSecret) {
    throw new Error('Vendor does not have partner_secret configured')
  }

  try {
    // Verify token signature and claims
    const verified = jwt.verify(token, partnerSecret, {
      algorithms: ['HS256'],
    }) as PartnerTokenPayload

    // Validate required claims
    if (!verified.external_user_id) {
      throw new Error('Invalid token: missing external_user_id claim')
    }
    if (!verified.jti) {
      throw new Error('Invalid token: missing jti claim')
    }

    return verified
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Partner token expired')
    }
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid partner token signature')
    }
    throw error
  }
}

