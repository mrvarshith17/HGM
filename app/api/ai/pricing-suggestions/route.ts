// app/api/ai/pricing-suggestions/route.ts
import { NextRequest, NextResponse } from 'next/server'

const AI_SERVICE_URL = process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'http://localhost:8000'

export async function POST(req: NextRequest) {
  try {
    const { salonId } = await req.json()

    if (!salonId) {
      return NextResponse.json(
        { error: 'salonId is required' },
        { status: 400 }
      )
    }

    console.log('[AI API] Getting pricing suggestions for salon:', salonId)

    const response = await fetch(`${AI_SERVICE_URL}/pricing-suggestions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ salonId }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('[AI API] Pricing error:', data)
      return NextResponse.json(data, { status: response.status })
    }

    console.log('[AI API] Got pricing suggestions for salon')
    return NextResponse.json(data)
  } catch (error) {
    console.error('[AI API] Pricing suggestions error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch pricing suggestions', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
