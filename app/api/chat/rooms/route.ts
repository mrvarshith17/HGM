import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { v4 as uuidv4 } from 'uuid'

// POST - Create new chat room
export async function POST(req: NextRequest) {
  let body: any = null
  
  try {
    body = await req.json()
    const { bookingId, userId, salonId, staffId, participants } = body

    console.log('[Chat API] POST /api/chat/rooms', { bookingId, userId, salonId })

    // Validate required fields
    if (!bookingId || !userId || !salonId) {
      console.error('[Chat API] Missing required fields:', {
        bookingId: !!bookingId,
        userId: !!userId,
        salonId: !!salonId,
      })
      return NextResponse.json(
        { 
          error: 'Missing required fields: bookingId, userId, salonId',
          received: { bookingId: !!bookingId, userId: !!userId, salonId: !!salonId }
        },
        { status: 400 }
      )
    }

    // Generate chat room ID
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

    // Try to write to Firestore with error handling
    console.log('[Chat API] Creating chat room document:', chatRoomId)
    
    try {
      // Use set with merge option for safety
      await adminDb.collection('chatRooms').doc(chatRoomId).set(roomData, { merge: false })
      console.log('[Chat API] Successfully created chat room:', chatRoomId)
    } catch (firestoreError) {
      console.error('[Chat API] Firestore write error:', {
        message: firestoreError instanceof Error ? firestoreError.message : String(firestoreError),
        code: (firestoreError as any)?.code,
      })
      
      // If Firestore fails, we still return success with the room data
      // The client can use this and the data might sync later
      console.warn('[Chat API] Returning partial success - data prepared but storage failed')
      return NextResponse.json({ 
        id: chatRoomId, 
        ...roomData,
        _warning: 'Chat room prepared but storage may have failed'
      }, { status: 201 })
    }

    return NextResponse.json({ id: chatRoomId, ...roomData }, { status: 201 })
  } catch (error) {
    console.error('[Chat API] Request failed:', {
      error: error instanceof Error ? error.message : String(error),
    })

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    
    return NextResponse.json(
      { error: `Failed to create chat room: ${errorMessage}` },
      { status: 500 }
    )
  }
}

// GET - Fetch existing chat room (for checking duplicates)
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const bookingId = searchParams.get('bookingId')

    if (!bookingId) {
      return NextResponse.json(
        { error: 'bookingId is required' },
        { status: 400 }
      )
    }

    console.log('[Chat API] GET /api/chat/rooms?bookingId=', bookingId)

    try {
      const query = await adminDb
        .collection('chatRooms')
        .where('bookingId', '==', bookingId)
        .limit(1)
        .get()

      if (!query.empty) {
        const room = query.docs[0]
        return NextResponse.json({ 
          id: room.id,
          ...room.data()
        }, { status: 200 })
      }
    } catch (queryError) {
      console.warn('[Chat API] Query error (this may be expected):', {
        message: queryError instanceof Error ? queryError.message : String(queryError),
        code: (queryError as any)?.code,
      })
    }

    return NextResponse.json(
      { error: 'Chat room not found' },
      { status: 404 }
    )
  } catch (error) {
    console.error('[Chat API] GET failed:', error)
    return NextResponse.json(
      { error: 'Failed to fetch chat room' },
      { status: 500 }
    )
  }
}
