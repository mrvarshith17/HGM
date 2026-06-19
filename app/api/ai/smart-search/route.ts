// app/api/ai/smart-search/route.ts
import { NextRequest, NextResponse } from 'next/server'

const AI_SERVICE_URL = process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'http://localhost:8000'

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json()

    if (!query || query.trim() === '') {
      return NextResponse.json(
        { error: 'query is required' },
        { status: 400 }
      )
    }

    console.log('[AI API] Smart search query:', query)

    const response = await fetch(`${AI_SERVICE_URL}/smart-search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('[AI API] Search error:', data)
      return NextResponse.json(data, { status: response.status })
    }

    console.log('[AI API] Found', data.matchingSalons?.length, 'matching salons')
    return NextResponse.json(data)
  } catch (error) {
    console.error('[AI API] Smart search error:', error)
    return NextResponse.json(
      { error: 'Failed to search salons', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
