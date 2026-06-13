import { NextRequest, NextResponse } from 'next/server'
import Replicate from 'replicate'
import { adminDb } from '@/lib/firebase-admin'
import { randomUUID } from 'node:crypto'

export const runtime = 'nodejs'

const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN_2

/**
 * AI Hairstyle Preview Generation
 * POST /api/hairstyle-preview
 * 
 * Uses a simpler approach with wrapped input parameters
 * Body:
 * {
 *   "hairstyleDescription": "short bob with layers",
 *   "imageUrl": "url_to_face_image" (optional),
 *   "userId": "user_id" (optional, to save preview)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { hairstyleDescription, imageUrl, userId } = body

    if (!hairstyleDescription || hairstyleDescription.trim().length === 0) {
      return NextResponse.json(
        { error: 'Hairstyle description is required' },
        { status: 400 }
      )
    }

    if (!REPLICATE_API_TOKEN) {
      return NextResponse.json(
        { error: 'Replicate API token not configured' },
        { status: 500 }
      )
    }

    const client = new Replicate({
      auth: REPLICATE_API_TOKEN,
    })

    // Use Replicate's Flux model - newer and more reliable
    // Model: black-forest-labs/flux-pro
    // Note: Flux requires parameters wrapped in 'input' object
    const output = await client.run(
      'black-forest-labs/flux-pro',
      {
        input: {
          prompt: `Professional portrait photo of a person with ${hairstyleDescription}, salon quality, high quality, detailed, well-lit`,
        }
      }
    )

    // output is an array of image URLs
    const imageUrls = Array.isArray(output) ? output : [output]
    const previewImage = imageUrls[0]

    // If userId provided, save to database
    if (userId && imageUrl && previewImage) {
      try {
        const db = adminDb
        const previewId = randomUUID()
        const now = new Date()

        const previewData = {
          previewId,
          userId,
          originalImage: imageUrl,
          hairstyleDescription,
          previewImage,
          createdAt: now,
          updatedAt: now,
        }

        await db.collection('hairstyle_previews').doc(previewId).set(previewData)
        console.log('[Hairstyle] Preview saved to database:', previewId)
      } catch (saveError) {
        console.warn('[Hairstyle] Could not save preview to database:', saveError)
        // Don't fail the request if saving fails
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Hairstyle preview generated successfully',
        images: imageUrls,
        description: hairstyleDescription,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Hairstyle preview generation error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate hairstyle preview'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
