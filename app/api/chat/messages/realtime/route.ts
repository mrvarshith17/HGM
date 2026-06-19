import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'

/**
 * Real-time Chat Messages API
 * Supports Firebase Realtime Database message operations
 */

// POST - Send a message (syncs to Realtime Database)
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

    const messageData = {
      chatRoomId,
      senderId,
      senderType,
      senderName,
      message,
      timestamp: Date.now(),
      read: false,
      readBy: { [senderId]: true },
    }

    // Write to Firestore for archival
    const messageId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    await adminDb.collection('messages').doc(messageId).set({
      messageId,
      ...messageData,
      timestamp: new Date(),
    })

    // Update chat room's last message
    await adminDb.collection('chatRooms').doc(chatRoomId).update({
      lastMessage: message,
      lastMessageTime: new Date(),
      updatedAt: new Date(),
    })

    // Sync to Realtime Database if configured
    if (process.env.FIREBASE_REALTIME_DB_URL) {
      try {
        const admin = require('firebase-admin')
        const rtDb = admin.database()
        
        // Add message to Realtime DB
        await rtDb.ref(`chatRooms/${chatRoomId}/messages/${messageId}`).set(messageData)
        
        // Update chat room metadata
        await rtDb.ref(`chatRooms/${chatRoomId}`).update({
          lastMessage: message,
          lastMessageTime: Date.now(),
          updatedAt: Date.now(),
        })
      } catch (rtError) {
        console.warn('Failed to sync message to Realtime Database:', rtError)
        // Continue - Firestore write was successful
      }
    }

    return NextResponse.json({ id: messageId, ...messageData }, { status: 201 })
  } catch (error) {
    console.error('Error sending message:', error)
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    )
  }
}

// GET - Fetch messages for a chat room
export async function GET(req: NextRequest) {
  try {
    const chatRoomId = req.nextUrl.searchParams.get('chatRoomId')
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '50', 10)

    if (!chatRoomId) {
      return NextResponse.json(
        { error: 'chatRoomId is required' },
        { status: 400 }
      )
    }

    const snapshot = await adminDb
      .collection('messages')
      .where('chatRoomId', '==', chatRoomId)
      .orderBy('timestamp', 'asc')
      .limitToLast(limit)
      .get()

    const messages = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))

    return NextResponse.json({ data: messages }, { status: 200 })
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    )
  }
}
