// app/api/sessions/[userId]/route.ts
import { NextRequest, NextResponse } from 'next/server'

const SESSIONS: Map<string, any> = new Map()

export async function GET(req: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const { userId } = params

    // In production, fetch from database
    if (!SESSIONS.has(userId)) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    return NextResponse.json(SESSIONS.get(userId))
  } catch (error) {
    console.error('[Get Session] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch session' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const { userId } = params
    const body = await req.json()

    if (!SESSIONS.has(userId)) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    const session = SESSIONS.get(userId)
    const updatedSession = {
      ...session,
      ...body,
      userId, // Ensure userId doesn't change
    }

    SESSIONS.set(userId, updatedSession)

    return NextResponse.json(updatedSession)
  } catch (error) {
    console.error('[Update Session] Error:', error)
    return NextResponse.json({ error: 'Failed to update session' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const { userId } = params

    SESSIONS.delete(userId)

    const response = NextResponse.json({ success: true })
    response.cookies.delete('sessionToken')
    response.cookies.delete('userId')

    return response
  } catch (error) {
    console.error('[Delete Session] Error:', error)
    return NextResponse.json({ error: 'Failed to delete session' }, { status: 500 })
  }
}
