import { NextRequest, NextResponse } from 'next/server'
import { addLocalSalon, readLocalSalons } from '@/lib/local-salon-store'
import { getSalonCity } from '@/lib/location'

export const runtime = 'nodejs'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

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

    const response = await fetch(url)
    const data = await response.json()

    if (!response.ok) {
      console.error('Salons backend error:', data)
      // Fallback to local salons
      let salons = await readLocalSalons()
      if (ownerId) {
        salons = salons.filter(s => s.ownerId === ownerId)
      }
      return NextResponse.json(salons)
    }

    let salons = Array.isArray(data) ? data : []
    // Filter by ownerId if provided
    if (ownerId) {
      salons = salons.filter(s => s.ownerId === ownerId)
    }
    return NextResponse.json(salons)
  } catch (error) {
    console.error('Salons route error, using local salon store:', error)
    let salons = await readLocalSalons()
    const searchParams = new URL(request.url).searchParams
    const ownerId = searchParams.get('ownerId')
    if (ownerId) {
      salons = salons.filter(s => s.ownerId === ownerId)
    }
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

  try {
    const response = await fetch(`${API_URL}/salons`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, city, services }),
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
