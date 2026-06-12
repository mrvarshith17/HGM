import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { findLocalBooking } from '@/lib/local-booking-store'
import {
  addLocalReview,
  findLocalReviewByBookingId,
  findLocalReviewsBySalonId,
  type LocalReview,
} from '@/lib/local-review-store'

export const runtime = 'nodejs'

type ReviewBody = {
  userId?: string
  userName?: string
  bookingId?: string
  rating?: number
  comment?: string
}

type BookingLike = {
  id?: string
  userId?: string
  salonId?: string
  status?: string
}

type SnapshotDoc = {
  id: string
  data: () => Record<string, unknown>
}

function normalizeDate(value: unknown) {
  if (!value) return new Date().toISOString()
  if (typeof value === 'string') return value
  if (value instanceof Date) return value.toISOString()
  if (typeof value === 'object' && value !== null && 'toDate' in value && typeof value.toDate === 'function') {
    return value.toDate().toISOString()
  }
  if (typeof value === 'object' && value !== null && '_seconds' in value) {
    const seconds = Number((value as { _seconds: number })._seconds)
    return new Date(seconds * 1000).toISOString()
  }
  return String(value)
}

function serializeReview(id: string, data: Record<string, unknown>) {
  return {
    id,
    salonId: String(data.salonId || ''),
    bookingId: String(data.bookingId || ''),
    userId: String(data.userId || ''),
    userName: String(data.userName || 'Customer'),
    rating: Number(data.rating || 0),
    comment: String(data.comment || ''),
    createdAt: normalizeDate(data.createdAt),
    updatedAt: normalizeDate(data.updatedAt),
  }
}

type SerializedReview = ReturnType<typeof serializeReview>

function isValidRating(rating: unknown): rating is number {
  return typeof rating === 'number' && Number.isInteger(rating) && rating >= 1 && rating <= 5
}

async function findBooking(bookingId: string): Promise<BookingLike | null> {
  try {
    const bookingDoc = await adminDb.collection('bookings').doc(bookingId).get()

    if (bookingDoc.exists) {
      return { id: bookingDoc.id, ...bookingDoc.data() } as BookingLike
    }
  } catch (error) {
    console.error('Failed to read booking from primary store:', error)
  }

  return findLocalBooking(bookingId)
}

async function getRemoteReviewsBySalonId(salonId: string) {
  const snapshot = await adminDb
    .collection('reviews')
    .where('salonId', '==', salonId)
    .get()

  return (snapshot.docs as SnapshotDoc[]).map((doc) => serializeReview(doc.id, doc.data()))
}

async function getRemoteReviewByBookingId(bookingId: string) {
  const directDoc = await adminDb.collection('reviews').doc(bookingId).get()

  if (directDoc.exists) {
    return serializeReview(directDoc.id, directDoc.data())
  }

  const snapshot = await adminDb
    .collection('reviews')
    .where('bookingId', '==', bookingId)
    .limit(1)
    .get()

  if (snapshot.empty) {
    return null
  }

  const doc = snapshot.docs[0]
  return serializeReview(doc.id, doc.data())
}

async function recalculateRemoteSalonRating(salonId: string) {
  const reviews = await getRemoteReviewsBySalonId(salonId)
  const reviewCount = reviews.length
  const rating = reviewCount
    ? Number((reviews.reduce((sum: number, review: SerializedReview) => sum + review.rating, 0) / reviewCount).toFixed(1))
    : 0

  await adminDb.collection('salons').doc(salonId).set(
    {
      rating,
      reviewCount,
      updatedAt: new Date(),
    },
    { merge: true }
  )
}

function mergeReviews(primaryReviews: SerializedReview[], localReviews: LocalReview[]) {
  const seen = new Set(primaryReviews.map((review) => review.bookingId || review.id))
  const merged = [...primaryReviews]

  for (const review of localReviews) {
    const key = review.bookingId || review.id
    if (!seen.has(key)) {
      merged.push(review)
      seen.add(key)
    }
  }

  return merged.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const localReviews = await findLocalReviewsBySalonId(id)

  try {
    const remoteReviews = await getRemoteReviewsBySalonId(id)
    return NextResponse.json(mergeReviews(remoteReviews, localReviews))
  } catch (error) {
    console.error('Reviews GET route error, using local fallback:', error)
    return NextResponse.json(localReviews)
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json() as ReviewBody
  const comment = body.comment?.trim() || ''

  if (!body.userId || !body.bookingId || !isValidRating(body.rating) || !comment) {
    return NextResponse.json(
      { error: 'User, completed booking, rating, and comment are required' },
      { status: 400 }
    )
  }

  const booking = await findBooking(body.bookingId)

  if (!booking) {
    return NextResponse.json(
      { error: 'Booking not found' },
      { status: 404 }
    )
  }

  if (booking.userId !== body.userId || booking.salonId !== id) {
    return NextResponse.json(
      { error: 'This booking cannot be reviewed by this user' },
      { status: 403 }
    )
  }

  if (booking.status !== 'completed') {
    return NextResponse.json(
      { error: 'You can review this salon after the booking is completed' },
      { status: 409 }
    )
  }

  try {
    const existingReview = await getRemoteReviewByBookingId(body.bookingId)

    if (existingReview) {
      return NextResponse.json(
        { error: 'This booking has already been reviewed' },
        { status: 409 }
      )
    }

    const now = new Date()
    const review = {
      salonId: id,
      bookingId: body.bookingId,
      userId: body.userId,
      userName: body.userName?.trim() || 'Customer',
      rating: body.rating,
      comment,
      createdAt: now,
      updatedAt: now,
    }

    await adminDb.collection('reviews').doc(body.bookingId).set(review)
    await recalculateRemoteSalonRating(id)

    return NextResponse.json(
      {
        message: 'Review submitted successfully',
        review: serializeReview(body.bookingId, review),
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Reviews POST route error, using local fallback:', error)

    try {
      const existingLocalReview = await findLocalReviewByBookingId(body.bookingId)

      if (existingLocalReview) {
        return NextResponse.json(
          { error: 'This booking has already been reviewed' },
          { status: 409 }
        )
      }

      const review = await addLocalReview({
        salonId: id,
        bookingId: body.bookingId,
        userId: body.userId,
        userName: body.userName,
        rating: body.rating,
        comment,
      })

      return NextResponse.json(
        {
          message: 'Review submitted locally',
          review,
        },
        { status: 201 }
      )
    } catch (fallbackError) {
      console.error('Reviews local fallback failed:', fallbackError)

      if (fallbackError instanceof Error && fallbackError.message === 'LOCAL_REVIEW_EXISTS') {
        return NextResponse.json(
          { error: 'This booking has already been reviewed' },
          { status: 409 }
        )
      }

      return NextResponse.json(
        { error: fallbackError instanceof Error ? fallbackError.message : 'Failed to submit review' },
        { status: 500 }
      )
    }
  }
}
