import { NextRequest, NextResponse } from 'next/server'
import { addLocalBooking } from '@/lib/local-booking-store'
import { sendBookingNotifications } from '@/lib/booking-notifications'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

type BookingPayload = {
  userId?: string
  salonId?: string
  serviceId?: string | null
  services?: unknown
  salonName?: string
  customerName?: string
  customerEmail?: string
  customerPhone?: string
  appointmentDate?: string
  appointmentTime?: string
  notes?: string
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

export async function POST(request: NextRequest) {
  let body: BookingPayload | null = null

  try {
    body = (await request.json()) as BookingPayload

    if (!body?.userId || !body?.salonId || !body?.appointmentDate || !body?.appointmentTime) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const services = normalizeServices(body.services)
    body = {
      ...body,
      services,
      serviceId: body.serviceId ?? services[0] ?? null,
    }

    const response = await fetch(`${API_URL}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    const data = await response.json()

    if (response.ok) {
      const booking = {
        ...(data.booking || {}),
        userId: body.userId!,
        salonId: body.salonId!,
        appointmentDate: body.appointmentDate!,
        appointmentTime: body.appointmentTime!,
        serviceId: body.serviceId ?? null,
        services,
        customerName: body.customerName,
        customerEmail: body.customerEmail,
        customerPhone: body.customerPhone,
        notes: body.notes,
        bookingId: data.bookingId || data.booking?.bookingId,
        salonName: body.salonName,
      }
      const notifications = await sendBookingNotifications(booking)

      return NextResponse.json({ ...data, notifications }, { status: 201 })
    }

    if (response.status === 400 && data.error === 'Missing required fields') {
      return NextResponse.json(data, { status: response.status })
    }

    throw new Error(data.error || `Backend booking request failed with status ${response.status}`)
  } catch (error) {
    console.error('Bookings route error, using local fallback:', error)

    if (!body) {
      return NextResponse.json(
        { error: 'Invalid booking request' },
        { status: 400 }
      )
    }

    try {
      const localBooking = await addLocalBooking({
        userId: body.userId!,
        salonId: body.salonId!,
        serviceId: body.serviceId ?? null,
        services: normalizeServices(body.services),
        customerName: body.customerName,
        customerEmail: body.customerEmail,
        customerPhone: body.customerPhone,
        appointmentDate: body.appointmentDate!,
        appointmentTime: body.appointmentTime!,
        notes: body.notes ?? '',
      })
      const notifications = await sendBookingNotifications({
        ...localBooking,
        salonName: body.salonName,
      })

      return NextResponse.json(
        {
          message: 'Booking created locally',
          bookingId: localBooking.bookingId,
          booking: localBooking,
          notifications,
        },
        { status: 201 }
      )
    } catch (fallbackError) {
      console.error('Bookings local fallback failed:', fallbackError)
      return NextResponse.json(
        { error: fallbackError instanceof Error ? fallbackError.message : 'Failed to create booking' },
        { status: 500 }
      )
    }
  }
}
