// app/api/sessions/[userId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import {
  decodeSessionCookie,
  deleteLocalSession,
  encodeSessionCookie,
  getLocalSession,
  getSessionCookieName,
  updateLocalSession,
} from '@/lib/local-session-store'

type RouteContext = {
  params: Promise<{ userId: string }>
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const { userId } = await params
    const sessionToken = req.cookies.get('sessionToken')?.value
    const cookieSession = decodeSessionCookie(req.cookies.get(getSessionCookieName())?.value)

    const session = cookieSession?.userId === userId && cookieSession.sessionToken === sessionToken
      ? cookieSession
      : await getLocalSession(userId, sessionToken)

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    return NextResponse.json(session)
  } catch (error) {
    console.error('[Get Session] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch session' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: RouteContext) {
  try {
    const { userId } = await params
    const body = await req.json()

    const cookieSession = decodeSessionCookie(req.cookies.get(getSessionCookieName())?.value)
    const updatedSession = cookieSession?.userId === userId
      ? { ...cookieSession, ...body, userId }
      : await updateLocalSession(userId, body)

    if (!updatedSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    const response = NextResponse.json(updatedSession)
    response.cookies.set(getSessionCookieName(), encodeSessionCookie(updatedSession), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60,
    })

    return response
  } catch (error) {
    console.error('[Update Session] Error:', error)
    return NextResponse.json({ error: 'Failed to update session' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  try {
    const { userId } = await params

    await deleteLocalSession(userId)

    const response = NextResponse.json({ success: true })
    response.cookies.delete('sessionToken')
    response.cookies.delete('userId')
    response.cookies.delete(getSessionCookieName())

    return response
  } catch (error) {
    console.error('[Delete Session] Error:', error)
    return NextResponse.json({ error: 'Failed to delete session' }, { status: 500 })
  }
}
