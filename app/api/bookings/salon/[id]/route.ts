import { NextRequest, NextResponse } from 'next/server'
import { findLocalBookingsBySalonId, mapBookingUserData } from '@/lib/local-booking-store'

export const runtime = 'nodejs'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

async function getLocalSalonBookings(id: string) {
  const localBookings = await findLocalBookingsBySalonId(id)
  return Promise.all(localBookings.map(mapBookingUserData))
}

function getBookingKey(booking: { id?: string; bookingId?: string }) {
  return booking.id || booking.bookingId || ''
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const response = await fetch(`${API_URL}/bookings/salon/${id}`)
    const data = await response.json()

    if (response.ok) {
      const localBookings = await getLocalSalonBookings(id)
      const remoteBookings = Array.isArray(data) ? data : []
      const remoteBookingKeys = new Set(remoteBookings.map(getBookingKey).filter(Boolean))
      const localOnlyBookings = localBookings.filter((booking) => !remoteBookingKeys.has(getBookingKey(booking)))

      return NextResponse.json([...remoteBookings, ...localOnlyBookings])
    }

    return NextResponse.json(await getLocalSalonBookings(id))
  } catch (error) {
    console.error('Salon bookings route error, using local fallback:', error)
    return NextResponse.json(await getLocalSalonBookings(id))
  }
}
