import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import {
  createRoom,
  getRoom,
  getRoomByBooking,
  getUserRooms,
} from '@/lib/memory-chat-store'

// POST - Create new chat room (stores in memory)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { bookingId, userId, salonId, staffId, participants } = body

    console.log('[Local Chat API] POST /api/chat/local-rooms', { bookingId, userId, salonId, staffId })

    // Validate required fields
    if (!bookingId || !userId || !salonId) {
      console.warn('[Local Chat API] Missing required fields:', { 
        bookingId: !!bookingId, 
        userId: !!userId, 
        salonId: !!salonId 
      })
      return NextResponse.json(
        { 
          error: 'Missing required fields: bookingId, userId, salonId',
        },
        { status: 400 }
      )
    }

    // Check if chat room already exists for this booking
    const existingRoom = getRoomByBooking(bookingId)
    
    if (existingRoom) {
      console.log('[Local Chat API] Chat room already exists for booking:', {
        bookingId,
        chatRoomId: existingRoom.chatRoomId,
        userId: existingRoom.userId,
        salonId: existingRoom.salonId,
      })
      return NextResponse.json({ id: existingRoom.chatRoomId, ...existingRoom }, { status: 200 })
    }

    // Create new chat room
    const chatRoomId = uuidv4()
    const roomData = {
      chatRoomId,
      bookingId,
      userId,
      salonId,
      staffId: staffId || null,
      participants: participants || [userId, salonId],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastMessage: null,
      lastMessageTime: null,
    }

    // Store in memory
    createRoom(roomData)

    console.log('[Local Chat API] Chat room created:', {
      chatRoomId,
      bookingId,
      userId,
      salonId,
      staffId,
    })
    return NextResponse.json({ id: chatRoomId, ...roomData }, { status: 201 })
  } catch (error) {
    console.error('[Local Chat API] POST error:', error)
    return NextResponse.json(
      { error: 'Failed to create chat room', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

// GET - Fetch chat rooms for a user (from memory)
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const userId = searchParams.get('userId')

    console.log('[Local Chat API] GET /api/chat/local-rooms?userId=', userId)

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    const rooms = getUserRooms(userId)

    console.log('[Local Chat API] Found', rooms.length, 'chat rooms for user:', {
      userId,
      roomIds: rooms.map(r => r.chatRoomId),
      salonIds: rooms.map(r => r.salonId),
    })
    return NextResponse.json({ data: rooms }, { status: 200 })
  } catch (error) {
    console.error('[Local Chat API] GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch chat rooms', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
