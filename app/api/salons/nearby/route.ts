import { NextRequest, NextResponse } from 'next/server'
import { calculateDistance, geocodeAddress, formatDistance } from '@/lib/google-maps-service'

export const runtime = 'nodejs'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const lat = searchParams.get('lat') || searchParams.get('latitude')
    const lng = searchParams.get('lng') || searchParams.get('longitude')
    const radiusKm = parseFloat(searchParams.get('radius') || '50')
    const limit = parseInt(searchParams.get('limit') || '20')

    if (!lat || !lng) {
      return NextResponse.json(
        { error: 'Latitude and longitude are required' },
        { status: 400 }
      )
    }

    const userLat = parseFloat(lat)
    const userLng = parseFloat(lng)

    if (isNaN(userLat) || isNaN(userLng)) {
      return NextResponse.json(
        { error: 'Invalid latitude or longitude' },
        { status: 400 }
      )
    }

    // Fetch all salons from database
    const response = await fetch(`${API_URL}/salons`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch salons from database' },
        { status: 500 }
      )
    }

    let allSalons = await response.json()
    if (!Array.isArray(allSalons)) {
      allSalons = []
    }

    // Ensure all salons have coordinates via geocoding if needed
    const salonsWithCoordinates = await Promise.all(
      allSalons.map(async (salon: any) => {
        if (salon.latitude && salon.longitude) {
          return salon
        }
        // Geocode address if coordinates not present
        const coords = await geocodeAddress(`${salon.address}, ${salon.city}`)
        return {
          ...salon,
          latitude: coords?.latitude || 0,
          longitude: coords?.longitude || 0,
        }
      })
    )

    // Calculate distances and filter by radius
    const nearBySalons = salonsWithCoordinates
      .filter((salon: any) => salon.latitude && salon.longitude)
      .map((salon: any) => {
        const distance = calculateDistance(userLat, userLng, salon.latitude, salon.longitude)
        return {
          ...salon,
          distance,
          distanceFormatted: formatDistance(distance),
        }
      })
      .filter((salon: any) => salon.distance <= radiusKm)
      .sort((a: any, b: any) => a.distance - b.distance)
      .slice(0, limit)

    return NextResponse.json({
      results: nearBySalons,
      count: nearBySalons.length,
      userLocation: { latitude: userLat, longitude: userLng },
      radius: radiusKm,
    })
  } catch (error) {
    console.error('Nearby salons error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch nearby salons' },
      { status: 500 }
    )
  }
}
