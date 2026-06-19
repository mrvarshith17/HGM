// app/api/ai/recommendations/route.ts
import { NextRequest, NextResponse } from 'next/server'

const AI_SERVICE_URL = process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'http://localhost:8000'

export async function POST(req: NextRequest) {
  try {
    const { userId, limit = 5 } = await req.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    console.log('[AI API] Getting recommendations for user:', userId)

    const response = await fetch(`${AI_SERVICE_URL}/recommendations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, limit }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('[AI API] Error response:', data)
      return NextResponse.json(data, { status: response.status })
    }

    console.log('[AI API] Got', data.recommendations?.length, 'recommendations')
    return NextResponse.json(data)
  } catch (error) {
    console.error('[AI API] Recommendations error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch recommendations', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
