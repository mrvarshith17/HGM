// app/api/auth/me/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const userId = req.cookies.get('userId')?.value
    const sessionToken = req.cookies.get('sessionToken')?.value

    if (!userId || !sessionToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // In production, verify session from database
    // For now, fetch from session store
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/sessions/${userId}`, {
      headers: { 'Content-Type': 'application/json' },
    })

    if (!response.ok) {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 })
    }

    const session = await response.json()
    return NextResponse.json(session)
  } catch (error) {
    console.error('[Auth Me] Error:', error)
    return NextResponse.json({ error: 'Failed to get user' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
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
