import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { v4 as uuidv4 } from 'uuid'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { chatRoomId, senderId, senderType, senderName, message } = body

    if (!chatRoomId || !senderId || !senderType || !message) {
      return NextResponse.json(
        { error: 'chatRoomId, senderId, senderType, and message are required' },
        { status: 400 }
      )
    }

    // Verify chat room exists
    const roomSnap = await adminDb.collection('chatRooms').doc(chatRoomId).get()
    if (!roomSnap.exists) {
      return NextResponse.json(
        { error: 'Chat room not found' },
        { status: 404 }
      )
    }

    const messageId = uuidv4()
    const messageData = {
      messageId,
      chatRoomId,
      senderId,
      senderType,
      senderName,
      message,
      timestamp: new Date(),
      read: false,
    }

    await adminDb.collection('messages').doc(messageId).set(messageData)

    // Update chat room's last message
    await roomSnap.ref.update({
      lastMessage: message,
      lastMessageTime: new Date(),
      updatedAt: new Date(),
    })

    return NextResponse.json({ id: messageId, ...messageData }, { status: 201 })
  } catch (error) {
    console.error('Error sending message:', error)
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    )
  }
}
