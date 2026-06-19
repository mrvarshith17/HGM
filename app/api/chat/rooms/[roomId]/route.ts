import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'

// GET - Fetch chat room details
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params

    const roomSnap = await adminDb.collection('chatRooms').doc(roomId).get()

    if (!roomSnap.exists) {
      return NextResponse.json(
        { error: 'Chat room not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      id: roomSnap.id,
      ...roomSnap.data()
    })
  } catch (error) {
    console.error('Error fetching chat room:', error)
    return NextResponse.json(
      { error: 'Failed to fetch chat room' },
      { status: 500 }
    )
  }
}
