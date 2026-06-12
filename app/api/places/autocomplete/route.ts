import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

const GCP_API_KEY = process.env.GCP_API_KEY

/**
 * Google Places Autocomplete API
 * GET /api/places/autocomplete?input=search_text
 */
export async function GET(request: NextRequest) {
  const input = request.nextUrl.searchParams.get('input')
  const componentRestrictions = request.nextUrl.searchParams.get('components') || 'country:in'

  if (!input || input.length < 2) {
    return NextResponse.json({ predictions: [] })
  }

  if (!GCP_API_KEY) {
    return NextResponse.json(
      { error: 'Google Maps API key not configured' },
      { status: 500 }
    )
  }

  try {
    const url = new URL('https://maps.googleapis.com/maps/api/place/autocomplete/json')
    url.searchParams.append('input', input)
    url.searchParams.append('components', componentRestrictions)
    url.searchParams.append('key', GCP_API_KEY)

    const response = await fetch(url.toString())
    const data = await response.json()

    if (data.status === 'OK') {
      return NextResponse.json({
        predictions: data.predictions.map((p: any) => ({
          placeId: p.place_id,
          description: p.description,
          mainText: p.main_text,
          secondaryText: p.secondary_text,
        })),
      })
    }

    if (data.status === 'ZERO_RESULTS') {
      return NextResponse.json({ predictions: [] })
    }

    console.error('Places Autocomplete Error:', data.status, data.error_message)
    return NextResponse.json(
      { error: data.error_message || 'Places API error' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Places autocomplete error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch place suggestions' },
      { status: 500 }
    )
  }
}
