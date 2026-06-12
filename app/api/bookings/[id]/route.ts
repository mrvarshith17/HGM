import { NextRequest, NextResponse } from 'next/server'
import { updateLocalBookingStatus } from '@/lib/local-booking-store'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed'
type BookingUpdateBody = {
  status?: BookingStatus
}

function isBookingStatus(status: unknown): status is BookingStatus {
  return status === 'pending' ||
    status === 'confirmed' ||
    status === 'cancelled' ||
    status === 'completed'
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let body: BookingUpdateBody | null = null
  try {
    const { id } = await params
    body = await request.json() as BookingUpdateBody

    if (!isBookingStatus(body.status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      )
    }

    const response = await fetch(`${API_URL}/bookings/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    const data = await response.json().catch(() => ({}))

    if (response.ok) {
      await updateLocalBookingStatus(id, body.status)
      return NextResponse.json(data)
    }

    const updated = await updateLocalBookingStatus(id, body.status)
    if (updated) {
      return NextResponse.json({ message: 'Booking updated locally' })
    }

    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('Booking detail route error, using local fallback:', error)
    if (body && isBookingStatus(body.status)) {
      const { id } = await params
      const updated = await updateLocalBookingStatus(id, body.status)
      if (updated) {
        return NextResponse.json({ message: 'Booking updated locally' })
      }
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
