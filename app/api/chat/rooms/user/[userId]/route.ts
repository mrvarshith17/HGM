import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'

// GET - Fetch all chat rooms for a user
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params

    console.log('[Chat API] GET /api/chat/rooms/user/', userId)

    // For development, if Firestore query fails, return empty array
    let rooms: any[] = []
    
    try {
      const roomsSnap = await adminDb
        .collection('chatRooms')
        .where('userId', '==', userId)
        .orderBy('updatedAt', 'desc')
        .get()

      rooms = roomsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      
      console.log('[Chat API] Found', rooms.length, 'chat rooms for user')
    } catch (queryError) {
      console.warn('[Chat API] Query error (returning empty list):', {
        message: queryError instanceof Error ? queryError.message : String(queryError),
        code: (queryError as any)?.code,
      })
      // Don't throw - return empty list instead
      rooms = []
    }

    return NextResponse.json({ data: rooms }, { status: 200 })
  } catch (error) {
    console.error('[Chat API] Unhandled error:', error)
    return NextResponse.json(
      { data: [], error: 'Failed to fetch chat rooms' },
      { status: 200 } // Return 200 with empty data for resilience
    )
  }
}
