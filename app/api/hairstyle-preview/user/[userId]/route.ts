import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'

export const runtime = 'nodejs'

/**
 * Get user hairstyle previews
 * GET /api/hairstyle-preview/user/[userId]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const userId = params.userId
    const db = adminDb

    const snapshot = await db
      .collection('hairstyle_previews')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(20)
      .get()

    const previews: any[] = []
    snapshot.forEach((doc) => {
      previews.push({ id: doc.id, ...doc.data() })
    })

    return NextResponse.json({
      success: true,
      previews,
    })
  } catch (error) {
    console.error('Get hairstyle previews error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch previews'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
