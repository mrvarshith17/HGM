import { NextRequest } from 'next/server'
import { adminAuth } from './firebase-admin'

export interface AuthContext {
  userId: string
  email?: string
}

/**
 * Verify Firebase ID token from request headers
 * Format: Authorization: Bearer <idToken>
 */
export async function verifyAuthHeader(req: NextRequest): Promise<AuthContext | null> {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      console.warn('[Auth] Missing or invalid Authorization header')
      return null
    }

    const idToken = authHeader.substring(7)
    const decodedToken = await adminAuth.verifyIdToken(idToken)
    
    return {
      userId: decodedToken.uid,
      email: decodedToken.email,
    }
  } catch (error) {
    console.error('[Auth] Token verification failed:', error)
    return null
  }
}

/**
 * Verify Firebase ID token without requiring it
 * Returns null if token is missing or invalid
 */
export async function verifyOptionalAuth(req: NextRequest): Promise<AuthContext | null> {
  return verifyAuthHeader(req)
}

/**
 * Verify Firebase ID token and throw if missing
 * Used for protected endpoints
 */
export async function requireAuth(req: NextRequest): Promise<AuthContext> {
  const auth = await verifyAuthHeader(req)
  if (!auth) {
    throw new Error('Missing or invalid authentication. Please provide a valid Bearer token.')
  }
  return auth
}
