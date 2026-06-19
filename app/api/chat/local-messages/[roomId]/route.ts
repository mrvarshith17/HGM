import { NextRequest, NextResponse } from 'next/server'
import { getRoomMessages } from '@/lib/memory-chat-store'

// GET - Fetch messages for a chat room (from memory)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params

    console.log('[Local Messages API] GET /api/chat/local-messages/', roomId)

    if (!roomId) {
      return NextResponse.json(
        { error: 'roomId is required' },
        { status: 400 }
      )
    }

    const roomMessages = getRoomMessages(roomId)

    console.log('[Local Messages API] Found', roomMessages.length, 'messages for room')
    return NextResponse.json({ data: roomMessages }, { status: 200 })
  } catch (error) {
    console.error('[Local Messages API] GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    )
  }
}
