// app/api/auth/me/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { decodeSessionCookie, getLocalSession, getSessionCookieName } from '@/lib/local-session-store'

export async function GET(req: NextRequest) {
  try {
    const userId = req.cookies.get('userId')?.value
    const sessionToken = req.cookies.get('sessionToken')?.value
    const cookieSession = decodeSessionCookie(req.cookies.get(getSessionCookieName())?.value)

    console.log('[Auth Me] userId:', userId, 'sessionToken:', !!sessionToken, 'cookieSession:', !!cookieSession)

    if (!userId || !sessionToken) {
      console.log('[Auth Me] Missing userId or sessionToken')
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const session = cookieSession?.userId === userId && cookieSession.sessionToken === sessionToken
      ? cookieSession
      : await getLocalSession(userId, sessionToken)

    console.log('[Auth Me] Session found:', !!session)

    if (!session) {
      console.log('[Auth Me] No session found in store or cookie validation failed')
      return NextResponse.json({ error: 'Session expired' }, { status: 401 })
    }

    return NextResponse.json(session)
  } catch (error) {
    console.error('[Auth Me] Error:', error)
    return NextResponse.json({ error: 'Failed to get user' }, { status: 500 })
  }
}

export async function POST() {
  try {
    // Logout endpoint
    const response = NextResponse.json({ success: true })
    response.cookies.delete('sessionToken')
    response.cookies.delete('userId')
    response.cookies.delete(getSessionCookieName())
    return response
  } catch (error) {
    console.error('[Auth Logout] Error:', error)
    return NextResponse.json({ error: 'Failed to logout' }, { status: 500 })
  }
}
