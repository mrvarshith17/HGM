import { NextRequest, NextResponse } from 'next/server'
import { addLocalSalon, readLocalSalons, writeLocalSalons } from '@/lib/local-salon-store'
import { getSalonCity } from '@/lib/location'
import { findLocalReviewsBySalonId } from '@/lib/local-review-store'
import { roundRating } from '@/lib/rating-utils'
import { adminDb } from '@/lib/firebase-admin'
import { geocodeAddress } from '@/lib/google-maps-service'

export const runtime = 'nodejs'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

// Function to get reviews from Firebase for a salon
async function getFirebaseReviewsForSalon(salonId: string) {
  try {
    const snapshot = await adminDb
      .collection('reviews')
      .where('salonId', '==', salonId)
      .get()
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      rating: Number(doc.data().rating || 0),
      ...doc.data()
    }))
  } catch (error) {
    console.error(`Error fetching Firebase reviews for salon ${salonId}:`, error)
    return []
  }
}

// Function to calculate salon rating from all reviews (Firebase + local)
async function calculateSalonRatingWithReviews(salon: any) {
  try {
    const firebaseReviews = await getFirebaseReviewsForSalon(salon.id)
    const localReviews = await findLocalReviewsBySalonId(salon.id)
    
    // Combine reviews, avoiding duplicates by booking ID
    const allReviews = []
    const seen = new Set()
    
    for (const review of [...firebaseReviews, ...localReviews]) {
      const key = review.bookingId || review.id
      if (!seen.has(key)) {
        allReviews.push(review)
        seen.add(key)
      }
    }
    
    if (allReviews.length > 0) {
      const average = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
      return {
        ...salon,
        rating: roundRating(average),
        reviewCount: allReviews.length
      }
    }
  } catch (error) {
    console.error(`Error calculating rating for salon ${salon.id}:`, error)
  }
  
  return salon
}

type SalonPayload = {
  ownerId?: string
  name?: string
  address?: string
  city?: string
  phone?: string
  description?: string
  services?: unknown
}

function normalizeServices(value: unknown) {
  const rawServices = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split(/[\n,]/)
      : []

  return Array.from(new Set(
    rawServices
      .map((service) => String(service).trim())
      .filter(Boolean)
  ))
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const ownerId = searchParams.get('ownerId')
    
    // First try the backend API with query params
    const queryString = searchParams.toString()
    const url = queryString ? `${API_URL}/salons?${queryString}` : `${API_URL}/salons`

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 3000) // 3 second timeout

    const response = await fetch(url, { signal: controller.signal })
    clearTimeout(timeout)
    const data = await response.json()

    if (!response.ok) {
      console.error('Salons backend error:', data)
      // Fallback to local salons
      let salons = await readLocalSalons()
      if (ownerId) {
        salons = salons.filter(s => s.ownerId === ownerId)
      }
      // Calculate ratings and geocode
      salons = await Promise.all(salons.map(async salon => {
        let salonWithRating = await calculateSalonRatingWithReviews(salon)
        // Add coordinates if missing
        if (!salonWithRating.latitude || !salonWithRating.longitude) {
          const coords = await geocodeAddress(`${salonWithRating.address}, ${salonWithRating.city}`)
          if (coords) {
            salonWithRating = { ...salonWithRating, ...coords }
          }
        }
        return salonWithRating
      }))
      return NextResponse.json(salons)
    }

    let salons = Array.isArray(data) ? data : []
    // Filter by ownerId if provided
    if (ownerId) {
      salons = salons.filter(s => s.ownerId === ownerId)
    }
    
    // Calculate ratings and geocode coordinates
    salons = await Promise.all(salons.map(async salon => {
      let salonWithRating = await calculateSalonRatingWithReviews(salon)
      // Add coordinates if missing
      if (!salonWithRating.latitude || !salonWithRating.longitude) {
        const coords = await geocodeAddress(`${salonWithRating.address}, ${salonWithRating.city}`)
        if (coords) {
          salonWithRating = { ...salonWithRating, ...coords }
        }
      }
      return salonWithRating
    }))
    
    return NextResponse.json(salons)
  } catch (error) {
    // Silently fallback to local store - backend is optional
    let salons = await readLocalSalons()
    const searchParams = new URL(request.url).searchParams
    const ownerId = searchParams.get('ownerId')
    if (ownerId) {
      salons = salons.filter(s => s.ownerId === ownerId)
    }
    // Calculate ratings and geocode
    salons = await Promise.all(salons.map(async salon => {
      let salonWithRating = await calculateSalonRatingWithReviews(salon)
      // Add coordinates if missing
      if (!salonWithRating.latitude || !salonWithRating.longitude) {
        const coords = await geocodeAddress(`${salonWithRating.address}, ${salonWithRating.city}`)
        if (coords) {
          salonWithRating = { ...salonWithRating, ...coords }
        }
      }
      return salonWithRating
    }))
    return NextResponse.json(salons)
  }
}

export async function POST(request: NextRequest) {
  const payload = await request.json() as SalonPayload

  if (!payload.ownerId || !payload.name || !payload.address || !payload.phone || !payload.description) {
    return NextResponse.json(
      { error: 'ownerId, name, address, phone, and description are required' },
      { status: 400 }
    )
  }

  const city = getSalonCity({ city: payload.city, address: payload.address })
  const services = normalizeServices(payload.services)

  // Geocode the address to get coordinates
  const coords = await geocodeAddress(`${payload.address}, ${city}`)

  try {
    const salonData = {
      ...payload,
      city,
      services,
      ...(coords && { latitude: coords.latitude, longitude: coords.longitude })
    }

    const response = await fetch(`${API_URL}/salons`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(salonData),
    })

    const data = await response.json()

    if (response.ok) {
      return NextResponse.json(data, { status: response.status })
    }

    if (response.status >= 500) {
      throw new Error(data.error || 'Backend unavailable')
    }

    return NextResponse.json(
      { error: data.error || 'Failed to create salon' },
      { status: response.status }
    )
  } catch (error) {
    console.error('Salons POST route error, using local salon store fallback:', error)

    try {
      const localSalon = await addLocalSalon({
        ownerId: payload.ownerId,
        name: payload.name,
        address: payload.address,
        city,
        phone: payload.phone,
        description: payload.description,
        services,
        ...(coords && { latitude: coords.latitude, longitude: coords.longitude })
      })

      return NextResponse.json(localSalon, { status: 201 })
    } catch (fallbackError) {
      console.error('Salons POST fallback error:', fallbackError)
      return NextResponse.json(
        { error: fallbackError instanceof Error ? fallbackError.message : 'Failed to create salon' },
        { status: 500 }
      )
    }
  }
}
