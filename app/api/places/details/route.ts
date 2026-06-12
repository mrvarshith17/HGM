import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

const GCP_API_KEY = process.env.GCP_API_KEY

/**
 * Get place details (coordinates, address components, etc.)
 * GET /api/places/details?placeId=place_id
 */
export async function GET(request: NextRequest) {
  const placeId = request.nextUrl.searchParams.get('placeId')

  if (!placeId) {
    return NextResponse.json(
      { error: 'placeId parameter is required' },
      { status: 400 }
    )
  }

  if (!GCP_API_KEY) {
    return NextResponse.json(
      { error: 'Google Maps API key not configured' },
      { status: 500 }
    )
  }

  try {
    const url = new URL('https://maps.googleapis.com/maps/api/place/details/json')
    url.searchParams.append('place_id', placeId)
    url.searchParams.append('fields', 'geometry,formatted_address,address_components,name')
    url.searchParams.append('key', GCP_API_KEY)

    const response = await fetch(url.toString())
    const data = await response.json()

    if (data.status === 'OK') {
      const result = data.result
      return NextResponse.json({
        address: result.formatted_address,
        latitude: result.geometry.location.lat,
        longitude: result.geometry.location.lng,
        name: result.name,
        addressComponents: result.address_components,
      })
    }

    console.error('Place Details Error:', data.status, data.error_message)
    return NextResponse.json(
      { error: data.error_message || 'Places API error' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Place details error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch place details' },
      { status: 500 }
    )
  }
}
