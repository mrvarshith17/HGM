/**
 * Google Maps API Service
 * Handles all Google Maps interactions including geocoding, distance calculations, and map displays
 */

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GCP_API_KEY

export interface Coordinates {
  latitude: number
  longitude: number
}

export interface LocationWithCoordinates extends Coordinates {
  address: string
  city?: string
}

export interface SalonWithDistance {
  id: string
  name: string
  address: string
  city: string
  latitude: number
  longitude: number
  distance?: number
  distanceFormatted?: string
  rating: number
  reviewCount: number
  phone: string
  email: string
  services: string[]
  profilePicture?: string
  ownerId?: string
}

/**
 * Geocode an address to get coordinates
 */
export async function geocodeAddress(address: string): Promise<Coordinates | null> {
  if (!GOOGLE_MAPS_API_KEY) {
    console.error('Google Maps API key not configured')
    return null
  }

  try {
    const encodedAddress = encodeURIComponent(address)
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${GOOGLE_MAPS_API_KEY}`
    )

    if (!response.ok) {
      throw new Error(`Geocoding failed: ${response.status}`)
    }

    const data = await response.json()

    if (data.results && data.results.length > 0) {
      const { lat, lng } = data.results[0].geometry.location
      return {
        latitude: lat,
        longitude: lng,
      }
    }

    return null
  } catch (error) {
    console.error('Geocoding error:', error)
    return null
  }
}

/**
 * Get user's current location using Geolocation API
 */
export function getUserLocation(): Promise<Coordinates | null> {
  return new Promise((resolve) => {
    if (!navigator?.geolocation) {
      console.warn('Geolocation not supported')
      resolve(null)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        })
      },
      (error) => {
        console.warn('Geolocation error:', error)
        resolve(null)
      }
    )
  })
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371 // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * Format distance for display (km or meters)
 */
export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m`
  }
  return `${distanceKm.toFixed(1)}km`
}

/**
 * Calculate distances for multiple salons from a user location
 */
export function calculateSalonDistances(
  salons: SalonWithDistance[],
  userLat: number,
  userLng: number
): SalonWithDistance[] {
  return salons.map((salon) => {
    const distance = calculateDistance(userLat, userLng, salon.latitude, salon.longitude)
    return {
      ...salon,
      distance,
      distanceFormatted: formatDistance(distance),
    }
  })
}

/**
 * Sort salons by distance from user location
 */
export function sortSalonsByDistance(
  salons: SalonWithDistance[],
  userLat: number,
  userLng: number
): SalonWithDistance[] {
  const salonsWithDistance = calculateSalonDistances(salons, userLat, userLng)
  return salonsWithDistance.sort((a, b) => (a.distance || 0) - (b.distance || 0))
}

/**
 * Filter salons within a specific radius (in kilometers)
 */
export function filterSalonsByRadius(
  salons: SalonWithDistance[],
  userLat: number,
  userLng: number,
  radiusKm: number
): SalonWithDistance[] {
  const salonsWithDistance = calculateSalonDistances(salons, userLat, userLng)
  return salonsWithDistance.filter((salon) => (salon.distance || 0) <= radiusKm)
}

/**
 * Get map embed URL for a specific address
 */
export function getMapEmbedUrl(
  lat: number,
  lng: number,
  zoom: number = 15
): string {
  return `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=${zoom}&size=600x400&key=${GOOGLE_MAPS_API_KEY}`
}

/**
 * Reverse geocode coordinates to get address
 */
export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  if (!GOOGLE_MAPS_API_KEY) {
    console.error('Google Maps API key not configured')
    return null
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`
    )

    if (!response.ok) {
      throw new Error(`Reverse geocoding failed: ${response.status}`)
    }

    const data = await response.json()

    if (data.results && data.results.length > 0) {
      return data.results[0].formatted_address
    }

    return null
  } catch (error) {
    console.error('Reverse geocoding error:', error)
    return null
  }
}

/**
 * Get nearby salons sorted by distance
 */
export function getNearestSalons(
  salons: SalonWithDistance[],
  userLat: number,
  userLng: number,
  limit: number = 10,
  radiusKm: number = 50
): SalonWithDistance[] {
  const filtered = filterSalonsByRadius(salons, userLat, userLng, radiusKm)
  const withDistance = calculateSalonDistances(filtered, userLat, userLng)
  return withDistance.sort((a, b) => (a.distance || 0) - (b.distance || 0)).slice(0, limit)
}
