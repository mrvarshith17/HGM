// app/api/sessions/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { encodeSessionCookie, getSessionCookieName, saveLocalSession } from '@/lib/local-session-store'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { userId, email, name, phone, userType, salonId, profilePicture } = body

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const sessionToken = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days

    const session = {
      userId,
      email,
      name,
      phone,
      userType,
      salonId,
      profilePicture,
      sessionToken,
      createdAt: new Date().toISOString(),
      expiresAt,
    }

    await saveLocalSession(session)

    // Set cookie for session
    const response = NextResponse.json(session)
    response.cookies.set('sessionToken', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    })
    response.cookies.set('userId', userId, {
      maxAge: 30 * 24 * 60 * 60,
    })
    response.cookies.set(getSessionCookieName(), encodeSessionCookie(session), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60,
    })

    return response
  } catch (error) {
    console.error('[Sessions API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    )
  }
}
