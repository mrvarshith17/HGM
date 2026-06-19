import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { addMessage, getRoom, getRoomMessages } from '@/lib/memory-chat-store'

// POST - Send a message (stores in memory)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { chatRoomId, senderId, senderType, senderName, message } = body

    console.log('[Local Messages API] POST /api/chat/local-messages', { 
      chatRoomId, 
      senderId, 
      senderName,
      senderType,
      messageLength: message?.length,
    })

    if (!chatRoomId || !senderId || !senderType || !message) {
      console.warn('[Local Messages API] Missing required fields:', { 
        chatRoomId: !!chatRoomId, 
        senderId: !!senderId, 
        senderType: !!senderType, 
        message: !!message 
      })
      return NextResponse.json(
        { error: 'chatRoomId, senderId, senderType, and message are required' },
        { status: 400 }
      )
    }

    // Verify chat room exists
    const room = getRoom(chatRoomId)
    if (!room) {
      console.error('[Local Messages API] Chat room not found:', chatRoomId)
      console.log('[Local Messages API] Available rooms: Check debug endpoint')
      return NextResponse.json(
        { error: 'Chat room not found. Please ensure the chat room has been created.' },
        { status: 404 }
      )
    }

    console.log('[Local Messages API] Room found:', { 
      chatRoomId: room.chatRoomId, 
      salonId: room.salonId, 
      userId: room.userId 
    })

    const messageId = uuidv4()
    const messageData = {
      messageId,
      chatRoomId,
      senderId,
      senderType,
      senderName,
      message,
      timestamp: new Date().toISOString(),
      read: false,
    }

    // Store in memory
    addMessage(messageData)

    // Verify message was added
    const messagesAfter = getRoomMessages(chatRoomId)
    console.log('[Local Messages API] Message sent:', { 
      messageId, 
      totalMessagesInRoom: messagesAfter.length,
      senderType,
      senderName,
    })

    return NextResponse.json({ id: messageId, ...messageData }, { status: 201 })
  } catch (error) {
    console.error('[Local Messages API] POST error:', error)
    return NextResponse.json(
      { error: 'Failed to send message', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
