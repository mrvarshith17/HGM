import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { v4 as uuidv4 } from 'uuid'

/**
 * Chat Rooms API - Real-time Database Support
 * Supports both Firestore and Firebase Realtime Database
 */

// POST - Create new chat room
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { bookingId, userId, salonId, staffId, participants } = body

    if (!bookingId || !userId || !salonId) {
      return NextResponse.json(
        { error: 'bookingId, userId, and salonId are required' },
        { status: 400 }
      )
    }

    // Check if chat room already exists for this booking
    const existingRoom = await adminDb
      .collection('chatRooms')
      .where('bookingId', '==', bookingId)
      .limit(1)
      .get()

    if (!existingRoom.empty) {
      return NextResponse.json(
        { id: existingRoom.docs[0].id, ...existingRoom.docs[0].data() },
        { status: 200 }
      )
    }

    const chatRoomId = uuidv4()
    const roomData = {
      chatRoomId,
      bookingId,
      userId,
      salonId,
      staffId: staffId || null,
      participants: participants || [userId, salonId],
      createdAt: new Date(),
      updatedAt: new Date(),
      lastMessage: null,
      lastMessageTime: null,
    }

    await adminDb.collection('chatRooms').doc(chatRoomId).set(roomData)

    // Also write to Realtime Database if configured
    if (process.env.FIREBASE_REALTIME_DB_URL) {
      try {
        const admin = require('firebase-admin')
        const rtDb = admin.database()
        await rtDb.ref(`chatRooms/${chatRoomId}`).set({
          ...roomData,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          lastMessageTime: null,
        })
      } catch (rtError) {
        console.warn('Failed to sync chat room to Realtime Database:', rtError)
        // Continue - Firestore write was successful
      }
    }

    return NextResponse.json({ id: chatRoomId, ...roomData }, { status: 201 })
  } catch (error) {
    console.error('Error creating chat room:', error)
    return NextResponse.json(
      { error: 'Failed to create chat room' },
      { status: 500 }
    )
  }
}

// GET - List chat rooms for a user
export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId')
    const salonId = req.nextUrl.searchParams.get('salonId')

    if (!userId && !salonId) {
      return NextResponse.json(
        { error: 'userId or salonId is required' },
        { status: 400 }
      )
    }

    let query = adminDb.collection('chatRooms')

    if (userId) {
      query = query.where('participants', 'array-contains', userId)
    } else if (salonId) {
      query = query.where('participants', 'array-contains', salonId)
    }

    const snapshot = await query.orderBy('updatedAt', 'desc').get()
    const rooms = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))

    return NextResponse.json({ data: rooms }, { status: 200 })
  } catch (error) {
    console.error('Error fetching chat rooms:', error)
    return NextResponse.json(
      { error: 'Failed to fetch chat rooms' },
      { status: 500 }
    )
  }
}
