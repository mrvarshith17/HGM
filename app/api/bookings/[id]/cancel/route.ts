import { NextRequest, NextResponse } from 'next/server'
import { updateLocalBookingStatus } from '@/lib/local-booking-store'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const response = await fetch(`${API_URL}/bookings/${id}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })

    const data = await response.json().catch(() => ({}))

    if (response.ok) {
      await updateLocalBookingStatus(id, 'cancelled')
      return NextResponse.json(data)
    }

    const local = await updateLocalBookingStatus(id, 'cancelled')
    if (local) {
      return NextResponse.json({ message: 'Booking cancelled locally' })
    }

    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('Booking cancel route error, using local fallback:', error)
    const { id } = await params
    const local = await updateLocalBookingStatus(id, 'cancelled')
    if (local) {
      return NextResponse.json({ message: 'Booking cancelled locally' })
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
