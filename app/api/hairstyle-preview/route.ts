import { NextRequest, NextResponse } from 'next/server'
import Replicate from 'replicate'

export const runtime = 'nodejs'

const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN_2

/**
 * AI Hairstyle Preview Generation
 * POST /api/hairstyle-preview
 * 
 * Body:
 * {
 *   "hairstyleDescription": "short bob with layers",
 *   "imageUrl": "url_to_face_image" (optional)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { hairstyleDescription, imageUrl } = body

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

    // Use Replicate's SDXL model for hairstyle generation
    // Model: stable-diffusion-3-medium
    const output = await client.run(
      'stability-ai/stable-diffusion-3-medium:84e60832212e7fd7b75372b0a3a18d439421fedb7d4d7d66c38efa3271f5d93',
      {
        prompt: `Portrait of a person with ${hairstyleDescription}, professional photography, salon style, high quality`,
        negative_prompt: 'blurry, low quality, distorted face',
        width: 512,
        height: 512,
        num_outputs: 1,
        num_inference_steps: 28,
        guidance_scale: 7.5,
      }
    )

    // output is an array of image URLs
    const imageUrls = Array.isArray(output) ? output : [output]

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
