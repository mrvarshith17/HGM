import { NextRequest, NextResponse } from 'next/server'
import { findLocalBookingsByUserId, mapBookingSalonData } from '@/lib/local-booking-store'
import { adminDb } from '@/lib/firebase-admin'
import { findLocalReviewsByUserId } from '@/lib/local-review-store'

export const runtime = 'nodejs'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

type BookingWithReviewState = {
  id?: string
  bookingId?: string
  reviewed?: boolean
}

type ReviewSnapshotDoc = {
  data: () => {
    bookingId?: unknown
  }
}

async function markReviewedBookings<T extends BookingWithReviewState>(bookings: T[], userId: string) {
  const reviewedBookingIds = new Set<string>()

  try {
    const snapshot = await adminDb
      .collection('reviews')
      .where('userId', '==', userId)
      .get()

    const reviewDocs = snapshot.docs as ReviewSnapshotDoc[]
    reviewDocs.forEach((doc) => {
      const data = doc.data()
      if (data.bookingId) {
        reviewedBookingIds.add(String(data.bookingId))
      }
    })
  } catch (error) {
    console.error('Failed to read remote review state:', error)
  }

  const localReviews = await findLocalReviewsByUserId(userId)
  localReviews.forEach((review) => reviewedBookingIds.add(review.bookingId))

  return bookings.map((booking) => ({
    ...booking,
    reviewed: Boolean(
      (booking.id && reviewedBookingIds.has(booking.id)) ||
      (booking.bookingId && reviewedBookingIds.has(booking.bookingId))
    ),
  }))
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const response = await fetch(`${API_URL}/bookings/user/${id}`)
    const data = await response.json()

    if (!response.ok) {
      const localBookings = await findLocalBookingsByUserId(id)
      const enriched = await Promise.all(localBookings.map(mapBookingSalonData))
      return NextResponse.json(await markReviewedBookings(enriched, id))
    }

    const bookings = Array.isArray(data) ? data : []
    return NextResponse.json(await markReviewedBookings(bookings, id))
  } catch (error) {
    console.error('User bookings route error, using local fallback:', error)
    const { id } = await params
    const localBookings = await findLocalBookingsByUserId(id)
    const enriched = await Promise.all(localBookings.map(mapBookingSalonData))
    return NextResponse.json(await markReviewedBookings(enriched, id))
  }
}
