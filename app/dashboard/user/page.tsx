'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Navigation from '@/components/navigation'
import { Button } from '@/components/ui/button'
import { Calendar, MapPin, Clock, Phone, Scissors, Star, Trash2, MessageCircle } from 'lucide-react'
import { formatTimeWith12Hour, formatAppointmentDate } from '@/lib/utils'
import { createChatRoom } from '@/lib/db-chat-service'
import { RecommendationWidget } from '@/components/recommendation-widget'
import { useAuth } from '@/hooks/useAuth'
import { getQuickBooking, clearQuickBooking } from '@/lib/db-temp-state-service'
import { AuthGuard } from '@/components/auth-guard'

interface Booking {
  id: string
  bookingId?: string
  salonId: string
  staffId?: string | null
  staffName?: string | null
  staffSpecialization?: string | null
  appointmentDate: string
  appointmentTime: string
  services?: string[]
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  reviewed?: boolean
  salon: {
    name: string
    address: string
    phone: string
  }
  notes: string
}

function BookingServices({ services }: { services?: string[] }) {
  const selectedServices = (services ?? []).filter(Boolean)

  if (selectedServices.length === 0) {
    return null
  }

  return (
    <div className="sm:col-span-2 md:col-span-3">
      <p className="text-sm text-slate-400 mb-2">Services</p>
      <div className="flex flex-wrap gap-2">
        {selectedServices.map((service) => (
          <span
            key={service}
            className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-sm text-indigo-100"
          >
            <Scissors className="h-3.5 w-3.5" />
            {service}
          </span>
        ))}
      </div>
    </div>
  )
}

export default function UserDashboardPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [quickBooking, setQuickBooking] = useState<{ salonId: string; salonName: string } | null>(null)
  const [reviewDrafts, setReviewDrafts] = useState<Record<string, { rating: number; comment: string; submitting?: boolean }>>({})

  const fetchBookings = useCallback(async (userId: string) => {
    try {
      const response = await fetch(`/api/bookings/user/${userId}`)
      if (response.ok) {
        const data = await response.json()
        setBookings(data)
      }
    } catch (error) {
      console.error('Failed to fetch bookings:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (authLoading) return

    if (!user) {
      router.push('/auth/login')
      return
    }

    fetchBookings(user.uid)

    // Load quick booking data from database
    const loadQuickBooking = async () => {
      try {
        const qbData = await getQuickBooking(user.uid)
        if (qbData) {
          setQuickBooking({
            salonId: qbData.salonId,
            salonName: qbData.staffId || 'Selected Salon', // Use a better name if available
          })
        }
      } catch (error) {
        console.error('Failed to load quick booking:', error)
      }
    }

    loadQuickBooking()
  }, [authLoading, user, fetchBookings, router])

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return

    try {
      const response = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: 'POST',
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error || 'Failed to cancel booking')
      }

      setBookings(bookings.map(b => 
        b.id === bookingId ? { ...b, status: 'cancelled' } : b
      ))
      alert('Booking cancelled successfully')
    } catch (error) {
      console.error('Cancel error:', error)
      alert(error instanceof Error ? error.message : 'Failed to cancel booking')
    }
  }

  const handleStartChat = async (booking: Booking) => {
    try {
      if (!user) {
        router.push('/auth/login')
        return
      }

      console.log('[Start Chat] Booking data:', {
        id: booking.id,
        bookingId: booking.bookingId,
        salonId: booking.salonId,
        userId: user.uid
      })

      // Validate required fields
      if (!booking.id && !booking.bookingId) {
        throw new Error('Booking ID is missing. Please refresh and try again.')
      }
      if (!booking.salonId) {
        throw new Error('Salon ID is missing. Cannot start chat.')
      }

      // Use bookingId if id is not available
      const chatBookingId = booking.id || booking.bookingId
      
      console.log('[Start Chat] Creating room with:', {
        bookingId: chatBookingId,
        userId: user.uid,
        salonId: booking.salonId
      })

      // Create or get existing chat room
      const chatRoom = await createChatRoom({
        bookingId: chatBookingId,
        userId: user.uid,
        salonId: booking.salonId,
        participants: [user.uid, booking.salonId],
      })

      console.log('[Start Chat] Room created:', chatRoom)
      
      // Navigate to chat page
      router.push('/dashboard/user/chat')
    } catch (error) {
      console.error('Failed to start chat:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to start chat. Please try again.'
      alert(errorMessage)
    }
  }

  const getBookingReviewKey = (booking: Booking) => booking.id || booking.bookingId || ''

  const getReviewDraft = (booking: Booking) => {
    const key = getBookingReviewKey(booking)
    return reviewDrafts[key] || { rating: 5, comment: '' }
  }

  const updateReviewDraft = (
    booking: Booking,
    updates: Partial<{ rating: number; comment: string; submitting: boolean }>
  ) => {
    const key = getBookingReviewKey(booking)
    setReviewDrafts((current) => ({
      ...current,
      [key]: {
        rating: current[key]?.rating ?? 5,
        comment: current[key]?.comment ?? '',
        ...updates,
      },
    }))
  }

  const handleSubmitReview = async (booking: Booking) => {
    const bookingId = getBookingReviewKey(booking)
    const draft = getReviewDraft(booking)

    if (!user || !bookingId) {
      router.push('/auth/login')
      return
    }

    if (!draft.comment.trim()) {
      alert('Please add a short review comment')
      return
    }

    updateReviewDraft(booking, { submitting: true })

    try {
      const response = await fetch(`/api/salons/${booking.salonId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          userName: user.name,
          bookingId,
          rating: draft.rating,
          comment: draft.comment,
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error || 'Failed to submit review')
      }

      setBookings((currentBookings) =>
        currentBookings.map((currentBooking) =>
          getBookingReviewKey(currentBooking) === bookingId
            ? { ...currentBooking, reviewed: true }
            : currentBooking
        )
      )
      setReviewDrafts((current) => ({
        ...current,
        [bookingId]: { rating: 5, comment: '' },
      }))
      alert('Review submitted successfully! The salon ratings are now updated.')
      
      // Clear any cached salon data so it will be re-fetched with updated ratings
      if (typeof window !== 'undefined') {
        console.log('Dispatching salonReviewSubmitted event for salonId:', booking.salonId)
        window.dispatchEvent(new CustomEvent('salonReviewSubmitted', { detail: { salonId: booking.salonId } }))
      }
    } catch (error) {
      console.error('Review submit error:', error)
      alert(error instanceof Error ? error.message : 'Failed to submit review')
    } finally {
      updateReviewDraft(booking, { submitting: false })
    }
  }

  const upcomingBookings = bookings.filter(b =>
    b.status === 'pending' || b.status === 'confirmed'
  )

  const pastBookings = bookings.filter(b =>
    b.status === 'completed' || b.status === 'cancelled'
  )

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900">
        <Navigation />

      <section className="px-6 py-12">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-4xl font-bold text-white mb-12">My Bookings</h1>

          {/* Quick Booking Alert from AI Search */}
          {quickBooking && (
            <div className="mb-8 p-6 bg-gradient-to-r from-green-950 to-emerald-950 rounded-lg border-2 border-green-500 shadow-lg">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-green-300 mb-2">📍 Ready to Book!</h3>
                  <p className="text-green-100 mb-4">
                    You found <span className="font-bold text-white">{quickBooking.salonName}</span> from AI search. Let's complete your booking!
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        if (user) {
                          clearQuickBooking(user.uid).catch(console.error)
                        }
                        setQuickBooking(null)
                        router.push(`/create-salon/booking?salonId=${quickBooking.salonId}`)
                      }}
                      className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
                    >
                      Book Now
                    </button>
                    <button
                      onClick={() => {
                        if (user) {
                          clearQuickBooking(user.uid).catch(console.error)
                        }
                        setQuickBooking(null)
                      }}
                      className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium rounded-lg transition-colors"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* AI Recommendations Section */}
          {!loading && user && (
            <div className="mb-12">
              <RecommendationWidget userId={user.uid} limit={5} />
            </div>
          )}

          {loading ? (
            <div className="text-center py-12">
              <p className="text-slate-400">Loading bookings...</p>
            </div>
          ) : (
            <>
              {/* Upcoming Bookings */}
              <div className="mb-12">
                <h2 className="text-2xl font-bold text-white mb-6">Upcoming Appointments</h2>
                {upcomingBookings.length === 0 ? (
                  <div className="rounded-lg border border-slate-800 bg-slate-900/50 backdrop-blur p-8 text-center">
                    <p className="text-slate-400 mb-4">No upcoming appointments</p>
                    <Button 
                      onClick={() => router.push('/search')}
                      className="bg-indigo-600 hover:bg-indigo-700"
                    >
                      Find a Salon
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {upcomingBookings.map((booking) => (
                      <div key={booking.id} className="rounded-lg border border-slate-800 bg-slate-900/50 backdrop-blur p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-xl font-semibold text-white">{booking.salon.name}</h3>
                            <span className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-medium ${
                              booking.status === 'confirmed' 
                                ? 'bg-green-600/20 text-green-300' 
                                : booking.status === 'completed'
                                  ? 'bg-blue-600/20 text-blue-300'
                                  : 'bg-yellow-600/20 text-yellow-300'
                            }`}>
                              {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-purple-400 border-purple-600/30 hover:bg-purple-900/20"
                              onClick={() => handleStartChat(booking)}
                            >
                              <MessageCircle className="h-4 w-4 mr-2" />
                              Chat
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-400 border-red-600/30 hover:bg-red-900/20"
                              onClick={() => handleCancelBooking(booking.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Cancel
                            </Button>
                          </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                          <div>
                            <p className="text-sm text-slate-400 mb-1">Date</p>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-indigo-400" />
                              <span className="text-white font-medium">{formatAppointmentDate(booking.appointmentDate)}</span>
                            </div>
                          </div>

                          <div>
                            <p className="text-sm text-slate-400 mb-1">Time</p>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-indigo-400" />
                              <span className="text-white font-medium">{formatTimeWith12Hour(booking.appointmentTime)}</span>
                            </div>
                          </div>

                          <div>
                            <p className="text-sm text-slate-400 mb-1">Phone</p>
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-indigo-400" />
                              <span className="text-white font-medium">{booking.salon.phone}</span>
                            </div>
                          </div>

                          <div className="sm:col-span-2 md:col-span-3">
                            <p className="text-sm text-slate-400 mb-1">Location</p>
                            <div className="flex items-start gap-2">
                              <MapPin className="h-4 w-4 text-indigo-400 flex-shrink-0 mt-1" />
                              <span className="text-white">{booking.salon.address}</span>
                            </div>
                          </div>

                          <BookingServices services={booking.services} />

                          {booking.staffId && booking.staffName && (
                            <div className="sm:col-span-2 md:col-span-3">
                              <p className="text-sm text-slate-400 mb-2">Professional</p>
                              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-600/10 border border-purple-600/30">
                                <span className="text-purple-200 font-medium">{booking.staffName}</span>
                                {booking.staffSpecialization && (
                                  <span className="text-purple-300 text-sm">• {booking.staffSpecialization}</span>
                                )}
                              </div>
                            </div>
                          )}

                          {booking.notes && (
                            <div className="sm:col-span-2 md:col-span-3">
                              <p className="text-sm text-slate-400 mb-1">Notes</p>
                              <p className="text-white">{booking.notes}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Past Bookings */}
              {pastBookings.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold text-white mb-6">Past Appointments</h2>
                  <div className="space-y-4">
                    {pastBookings.map((booking) => (
                      <div key={booking.id} className="rounded-lg border border-slate-800 bg-slate-900/50 backdrop-blur p-6 opacity-75">
                        {(() => {
                          const draft = getReviewDraft(booking)

                          return (
                            <>
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-xl font-semibold text-white">{booking.salon.name}</h3>
                            <span className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-medium ${
                              booking.status === 'completed'
                                ? 'bg-blue-600/20 text-blue-300'
                                : 'bg-red-600/20 text-red-300'
                            }`}>
                              {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                            </span>
                          </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                          <div>
                            <p className="text-sm text-slate-400 mb-1">Date</p>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-indigo-400" />
                              <span className="text-white font-medium">{formatAppointmentDate(booking.appointmentDate)}</span>
                            </div>
                          </div>

                          <div>
                            <p className="text-sm text-slate-400 mb-1">Time</p>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-indigo-400" />
                              <span className="text-white font-medium">{formatTimeWith12Hour(booking.appointmentTime)}</span>
                            </div>
                          </div>

                          <div>
                            <p className="text-sm text-slate-400 mb-1">Phone</p>
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-indigo-400" />
                              <span className="text-white font-medium">{booking.salon.phone}</span>
                            </div>
                          </div>

                          <div className="sm:col-span-2 md:col-span-3">
                            <p className="text-sm text-slate-400 mb-1">Location</p>
                            <div className="flex items-start gap-2">
                              <MapPin className="h-4 w-4 text-indigo-400 flex-shrink-0 mt-1" />
                              <span className="text-white">{booking.salon.address}</span>
                            </div>
                          </div>

                          <BookingServices services={booking.services} />

                          {booking.staffId && booking.staffName && (
                            <div className="sm:col-span-2 md:col-span-3">
                              <p className="text-sm text-slate-400 mb-2">Professional</p>
                              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-600/10 border border-purple-600/30">
                                <span className="text-purple-200 font-medium">{booking.staffName}</span>
                                {booking.staffSpecialization && (
                                  <span className="text-purple-300 text-sm">• {booking.staffSpecialization}</span>
                                )}
                              </div>
                            </div>
                          )}

                          {booking.notes && (
                            <div className="sm:col-span-2 md:col-span-3">
                              <p className="text-sm text-slate-400 mb-1">Notes</p>
                              <p className="text-white">{booking.notes}</p>
                            </div>
                          )}
                        </div>

                        {booking.status === 'completed' && (
                          <div className="mt-6 border-t border-slate-700 pt-5">
                            {booking.reviewed ? (
                              <p className="text-sm font-medium text-green-300">Review submitted</p>
                            ) : (
                              <div className="space-y-4">
                                <div>
                                  <p className="text-sm text-slate-400 mb-2">Your Rating</p>
                                  <div className="flex gap-1">
                                    {[1, 2, 3, 4, 5].map((rating) => (
                                      <button
                                        key={rating}
                                        type="button"
                                        onClick={() => updateReviewDraft(booking, { rating })}
                                        className="rounded p-1 text-yellow-400 transition hover:bg-slate-800"
                                        aria-label={`${rating} star rating`}
                                      >
                                        <Star
                                          className={`h-5 w-5 ${
                                            rating <= draft.rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-600'
                                          }`}
                                        />
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                <div>
                                  <label className="block text-sm text-slate-400 mb-2">Review</label>
                                  <textarea
                                    value={draft.comment}
                                    onChange={(event) => updateReviewDraft(booking, { comment: event.target.value })}
                                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    rows={3}
                                    placeholder="Share your experience"
                                  />
                                </div>

                                <Button
                                  type="button"
                                  size="sm"
                                  onClick={() => handleSubmitReview(booking)}
                                  disabled={draft.submitting}
                                  className="bg-indigo-600 hover:bg-indigo-700"
                                >
                                  <Star className="h-4 w-4 mr-2" />
                                  {draft.submitting ? 'Submitting...' : 'Submit Review'}
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                            </>
                          )
                        })()}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </section>
      </div>
    </AuthGuard>
  )
}
