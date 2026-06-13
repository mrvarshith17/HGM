import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { randomUUID } from 'node:crypto'

export const runtime = 'nodejs'

/**
 * Save hairstyle preview to database
 * POST /api/hairstyle-preview/save
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, originalImage, hairstyleDescription, previewImage } = body

    if (!userId || !originalImage || !hairstyleDescription || !previewImage) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const db = adminDb
    const previewId = randomUUID()
    const now = new Date()

    const previewData = {
      previewId,
      userId,
      originalImage,
      hairstyleDescription,
      previewImage,
      createdAt: now,
      updatedAt: now,
    }

    await db.collection('hairstyle_previews').doc(previewId).set(previewData)

    return NextResponse.json(
      {
        success: true,
        message: 'Hairstyle preview saved successfully',
        preview: previewData,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Save hairstyle preview error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to save preview'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

/**
 * Get user hairstyle previews
 * GET /api/hairstyle-preview/user/[userId]
 */
export async function GET(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const userId = params.userId
    const db = adminDb

    const snapshot = await db
      .collection('hairstyle_previews')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(20)
      .get()

    const previews = []
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

/**
 * Delete hairstyle preview
 * DELETE /api/hairstyle-preview/[previewId]
 */
export async function DELETE(request: NextRequest, { params }: { params: { previewId: string } }) {
  try {
    const previewId = params.previewId
    const db = adminDb

    await db.collection('hairstyle_previews').doc(previewId).delete()

    return NextResponse.json({
      success: true,
      message: 'Hairstyle preview deleted successfully',
    })
  } catch (error) {
    console.error('Delete hairstyle preview error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete preview'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
