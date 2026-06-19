// app/api/users/[userId]/quick-booking/route.ts
import { NextRequest, NextResponse } from 'next/server'

const QUICK_BOOKINGS: Map<string, any> = new Map()

export async function POST(req: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const { userId } = params
    const body = await req.json()

    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 minutes

    const quickBooking = {
      userId,
      ...body,
      timestamp: new Date().toISOString(),
      expiresAt,
    }

    QUICK_BOOKINGS.set(userId, quickBooking)

    return NextResponse.json(quickBooking)
  } catch (error) {
    console.error('[Quick Booking API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to save quick booking' },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const { userId } = params

    if (!QUICK_BOOKINGS.has(userId)) {
      return NextResponse.json(null)
    }

    const booking = QUICK_BOOKINGS.get(userId)
    
    // Check if expired
    if (new Date(booking.expiresAt) < new Date()) {
      QUICK_BOOKINGS.delete(userId)
      return NextResponse.json(null)
    }

    return NextResponse.json(booking)
  } catch (error) {
    console.error('[Get Quick Booking] Error:', error)
    return NextResponse.json({ error: 'Failed to get quick booking' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const { userId } = params

    QUICK_BOOKINGS.delete(userId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Delete Quick Booking] Error:', error)
    return NextResponse.json({ error: 'Failed to delete quick booking' }, { status: 500 })
  }
}
