import { NextRequest, NextResponse } from 'next/server'
import { getSalonRooms } from '@/lib/memory-chat-store'

// GET - Fetch chat rooms for a salon
export async function GET(req: NextRequest, { params }: { params: Promise<{ salonId: string }> }) {
  try {
    const { salonId } = await params

    if (!salonId || salonId.trim() === '') {
      console.warn('[Local Salon Chat API] salonId is empty or undefined')
      return NextResponse.json({ data: [] }, { status: 200 })
    }

    console.log('[Local Salon Chat API] GET /api/chat/local-salon-rooms/', salonId)

    const rooms = getSalonRooms(salonId)

    console.log('[Local Salon Chat API] Found', rooms.length, 'chat rooms for salon')
    return NextResponse.json({ data: rooms }, { status: 200 })
  } catch (error) {
    console.error('[Local Salon Chat API] GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch salon chat rooms' },
      { status: 500 }
    )
  }
}
