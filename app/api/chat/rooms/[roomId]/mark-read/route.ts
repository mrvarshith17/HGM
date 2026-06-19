import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'

// PUT - Mark messages as read
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params
    const body = await req.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    // Mark all messages in the room as read
    const messagesSnap = await adminDb
      .collection('messages')
      .where('chatRoomId', '==', roomId)
      .get()

    const batch = adminDb.batch()

    messagesSnap.docs.forEach(doc => {
      batch.update(doc.ref, { read: true })
    })

    await batch.commit()

    return NextResponse.json({ message: 'Messages marked as read' })
  } catch (error) {
    console.error('Error marking messages as read:', error)
    return NextResponse.json(
      { error: 'Failed to mark messages as read' },
      { status: 500 }
    )
  }
}
