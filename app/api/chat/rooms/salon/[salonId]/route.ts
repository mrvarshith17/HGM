import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'

// GET - Fetch all chat rooms for a salon
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ salonId: string }> }
) {
  try {
    const { salonId } = await params

    const roomsSnap = await adminDb
      .collection('chatRooms')
      .where('salonId', '==', salonId)
      .orderBy('updatedAt', 'desc')
      .get()

    const rooms = roomsSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))

    return NextResponse.json({ data: rooms })
  } catch (error) {
    console.error('Error fetching salon chat rooms:', error)
    return NextResponse.json(
      { error: 'Failed to fetch chat rooms' },
      { status: 500 }
    )
  }
}
