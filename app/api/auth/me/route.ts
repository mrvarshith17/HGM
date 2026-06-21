// app/api/auth/me/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getLocalSession } from '@/lib/local-session-store'

export async function GET(req: NextRequest) {
  try {
    const userId = req.cookies.get('userId')?.value
    const sessionToken = req.cookies.get('sessionToken')?.value

    if (!userId || !sessionToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const session = await getLocalSession(userId, sessionToken)

    if (!session) {
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
    return response
  } catch (error) {
    console.error('[Auth Logout] Error:', error)
    return NextResponse.json({ error: 'Failed to logout' }, { status: 500 })
  }
}
