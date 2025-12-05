import jwt from 'jsonwebtoken'

export interface WidgetSessionPayload {
  user_id: string
  vendor_id: string
  iat?: number
  exp?: number
}

/**
 * Sign a widget session JWT
 * TTL defaults to 7 days (configurable via env)
 */
export function signWidgetSession(payload: WidgetSessionPayload): string {
  const secret = process.env.JWT_SECRET_WIDGET
  if (!secret) {
    throw new Error('JWT_SECRET_WIDGET environment variable is not set')
  }

  const ttlSeconds = parseInt(process.env.WIDGET_SESSION_TTL_SECONDS || '604800', 10) // Default 7 days
  const expiresIn = ttlSeconds

  return jwt.sign(
    {
      user_id: payload.user_id,
      vendor_id: payload.vendor_id,
    },
    secret,
    {
      expiresIn,
      algorithm: 'HS256',
    }
  )
}

/**
 * Verify a widget session JWT
 */
export function verifyWidgetSession(token: string): WidgetSessionPayload {
  const secret = process.env.JWT_SECRET_WIDGET
  if (!secret) {
    throw new Error('JWT_SECRET_WIDGET environment variable is not set')
  }

  try {
    const decoded = jwt.verify(token, secret, {
      algorithms: ['HS256'],
    }) as WidgetSessionPayload

    return decoded
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Widget session expired')
    }
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid widget session token')
    }
    throw error
  }
}

/**
 * Extract widget session from Authorization header
 */
export function extractWidgetSession(authHeader: string | null): WidgetSessionPayload | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.substring(7)
  try {
    return verifyWidgetSession(token)
  } catch {
    return null
  }
}

