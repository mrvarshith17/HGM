'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Navigation from '@/components/navigation'
import { Button } from '@/components/ui/button'
import { Calendar, Users, CheckCircle, TrendingUp, Clock, Phone, Mail, Scissors, Trash2 } from 'lucide-react'
import { formatTimeWith12Hour, formatAppointmentDate } from '@/lib/utils'

interface Booking {
  id: string
  customerName?: string
  customerPhone?: string
  customerEmail?: string
  appointmentDate: string
  appointmentTime: string
  services?: string[]
  status: string
  user: {
    name: string
    phone: string
    email: string
  }
}

interface Review {
  id: string
  salonId: string
  bookingId: string
  userId: string
  userName: string
  rating: number
  comment: string
  createdAt: string
}

interface Stats {
  totalBookings: number
  todayBookings: number
  totalCompleted: number
  averageRating: number
}

interface SalonSummary {
  id: string
  ownerId: string
  name: string
  address: string
  phone: string
  services?: string[]
}

function BookingServices({ services, className = '' }: { services?: string[]; className?: string }) {
  const selectedServices = (services ?? []).filter(Boolean)

  if (selectedServices.length === 0) {
    return null
  }

  return (
    <div className={className}>
      <p className="text-xs text-slate-400 mb-2">Services</p>
      <div className="flex flex-wrap gap-2">
        {selectedServices.map((service) => (
          <span
            key={service}
            className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs text-indigo-100"
          >
            <Scissors className="h-3.5 w-3.5" />
            {service}
          </span>
        ))}
      </div>
    </div>
  )
}

function getDateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function parseAppointmentTime(time: string) {
  const match = time.trim().match(/^(\d{1,2}):(\d{2})(?:\s*([AP]M))?$/i)

  if (!match) {
    return { hours: 0, minutes: 0 }
  }

  let hours = Number(match[1])
  const minutes = Number(match[2])
  const period = match[3]?.toUpperCase()

  if (period === 'PM' && hours < 12) hours += 12
  if (period === 'AM' && hours === 12) hours = 0

  return { hours, minutes }
}

function getBookingTimestamp(booking: Booking) {
  const [year, month, day] = booking.appointmentDate.split('-').map(Number)

  if (!year || !month || !day) {
    return new Date(booking.appointmentDate).getTime()
  }

  const { hours, minutes } = parseAppointmentTime(booking.appointmentTime)
  return new Date(year, month - 1, day, hours, minutes).getTime()
}

function isTodayBooking(booking: Booking) {
  return booking.appointmentDate === getDateKey()
}

function getCustomerName(booking: Booking) {
  return booking.customerName || booking.user.name || 'Customer'
}

function getCustomerPhone(booking: Booking) {
  return booking.customerPhone || booking.user.phone || 'N/A'
}

function getCustomerEmail(booking: Booking) {
  return booking.customerEmail || booking.user.email || 'N/A'
}

export default function SalonDashboardPage() {
  const router = useRouter()
  const [salons, setSalons] = useState<SalonSummary[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [deletingSalonId, setDeletingSalonId] = useState<string | null>(null)

  const fetchDashboardData = useCallback(async (salonOwnerId: string) => {
    try {
      setLoading(true)
      setMessage('')
      console.log(`Fetching salons for owner: ${salonOwnerId}`)
      
      // Get all salons belonging to this owner
      const salonsRes = await fetch(`/api/salons?ownerId=${encodeURIComponent(salonOwnerId)}`)
      const salonsJson = await salonsRes.json()
      const salonsData: SalonSummary[] = Array.isArray(salonsJson) ? salonsJson : []
      setSalons(salonsData)
      
      console.log(`Found ${salonsData.length} salons for owner ${salonOwnerId}:`, salonsData)

      if (salonsData.length === 0) {
        setBookings([])
        setUpcomingBookings([])
        setReviews([])
        setStats(null)
        setMessage('No salon profile was found for this owner yet. Create one to get started!')
        return
      }

      const bookingLists = await Promise.all(
        salonsData.map(async (salon) => {
          const bookingsRes = await fetch(`/api/bookings/salon/${salon.id}`)

          if (!bookingsRes.ok) {
            console.error('Bookings API error:', salon.id, bookingsRes.status)
            return []
          }

          const bookingsJson = await bookingsRes.json()
          return Array.isArray(bookingsJson) ? bookingsJson as Booking[] : []
        })
      )

      // Fetch reviews for all salons
      const reviewLists = await Promise.all(
        salonsData.map(async (salon) => {
          try {
            const reviewsRes = await fetch(`/api/salons/${salon.id}/reviews`)
            if (!reviewsRes.ok) return []
            const reviewsJson = await reviewsRes.json()
            return Array.isArray(reviewsJson) ? reviewsJson as Review[] : []
          } catch (error) {
            console.error('Reviews API error:', salon.id, error)
            return []
          }
        })
      )

      const allBookings = bookingLists.flat()
      const allReviews = reviewLists.flat()

      const todayBookings = allBookings
        .filter((booking) => isTodayBooking(booking) && booking.status !== 'cancelled')
        .sort((a, b) => getBookingTimestamp(a) - getBookingTimestamp(b))
      const upcoming = allBookings
        .filter((booking) => (
          getBookingTimestamp(booking) > Date.now() &&
          booking.status !== 'cancelled' &&
          booking.status !== 'completed'
        ))
        .sort((a, b) => getBookingTimestamp(a) - getBookingTimestamp(b))

      // Calculate average rating from reviews
      const averageRating = allReviews.length > 0
        ? Number((allReviews.reduce((sum: number, review: Review) => sum + review.rating, 0) / allReviews.length).toFixed(1))
        : 0

      setBookings(todayBookings)
      setUpcomingBookings(upcoming)
      setReviews(allReviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()))
      setStats({
        totalBookings: allBookings.length,
        todayBookings: todayBookings.length,
        totalCompleted: allBookings.filter((booking) => booking.status === 'completed').length,
        averageRating,
      })

      if (allBookings.length === 0) {
        setMessage('No bookings yet.')
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
      setMessage('Error loading dashboard. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const userId = localStorage.getItem('authToken')
    const userData = localStorage.getItem('userData')

    if (!userId || !userData) {
      router.push('/auth/login')
      return
    }

    try {
      const user = JSON.parse(userData)
      if (user.userType !== 'salon_owner') {
        router.push('/dashboard/user')
        return
      }
      fetchDashboardData(user.uid)
    } catch (error) {
      console.error('Error parsing user data:', error)
      router.push('/auth/login')
    }
  }, [fetchDashboardData, router])

  const handleBookingStatus = async (bookingId: string, status: string) => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })

      if (response.ok) {
        const userData = localStorage.getItem('userData')

        if (userData) {
          const user = JSON.parse(userData)
          await fetchDashboardData(user.uid)
        }

        alert('Booking status updated')
      }
    } catch (error) {
      console.error('Update error:', error)
      alert('Failed to update booking')
    }
  }

  const handleDeleteSalon = async (salon: SalonSummary) => {
    if (!confirm(`Delete ${salon.name}? This removes the salon from customer search and booking pages.`)) {
      return
    }

    const userData = localStorage.getItem('userData')
    if (!userData) {
      router.push('/auth/login')
      return
    }

    try {
      const user = JSON.parse(userData)
      setDeletingSalonId(salon.id)

      const response = await fetch(`/api/salons/${salon.id}?ownerId=${encodeURIComponent(user.uid)}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error || 'Failed to delete salon')
      }

      await fetchDashboardData(user.uid)
      alert('Salon deleted successfully')
    } catch (error) {
      console.error('Delete salon error:', error)
      alert(error instanceof Error ? error.message : 'Failed to delete salon')
    } finally {
      setDeletingSalonId(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900">
        <Navigation />
        <div className="flex items-center justify-center py-12">
          <p className="text-slate-400">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900">
      <Navigation />

      <section className="px-6 py-12">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-4xl font-bold text-white mb-12">Salon Dashboard</h1>

          {message && (
            <div className="mb-8 rounded-lg border border-yellow-600/30 bg-yellow-900/20 p-4 text-yellow-100">
              {message}
            </div>
          )}

          {salons.length > 0 && (
            <div className="mb-12 rounded-lg border border-slate-800 bg-slate-900/50 backdrop-blur p-8">
              <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-white">My Salons</h2>
                  <p className="mt-1 text-sm text-slate-400">Manage your salon profiles and services.</p>
                </div>
                <Button
                  type="button"
                  onClick={() => router.push('/create-salon')}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  Add Salon
                </Button>
              </div>

              <div className="grid gap-4">
                {salons.map((salon) => (
                  <div key={salon.id} className="rounded-lg border border-slate-700 bg-slate-800/30 p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-white">{salon.name}</h3>
                        <p className="mt-1 text-sm text-slate-400">{salon.address}</p>
                        <p className="mt-1 text-sm text-slate-400">{salon.phone}</p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteSalon(salon)}
                        disabled={deletingSalonId === salon.id}
                        className="border-red-600/30 text-red-300 hover:bg-red-900/20"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        {deletingSalonId === salon.id ? 'Deleting...' : 'Delete'}
                      </Button>
                    </div>

                    {(salon.services ?? []).length > 0 && (
                      <div className="mt-4">
                        <p className="mb-2 text-xs text-slate-400">Services Provided</p>
                        <div className="flex flex-wrap gap-2">
                          {(salon.services ?? []).map((service) => (
                            <span
                              key={service}
                              className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs text-indigo-100"
                            >
                              <Scissors className="h-3.5 w-3.5" />
                              {service}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stats Grid */}
          {stats && (
            <div className="grid gap-6 mb-12 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border border-slate-800 bg-slate-900/50 backdrop-blur p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm mb-1">Today&apos;s Bookings</p>
                    <p className="text-3xl font-bold text-white">{stats.todayBookings}</p>
                  </div>
                  <Calendar className="h-8 w-8 text-indigo-400 opacity-50" />
                </div>
              </div>

              <div className="rounded-lg border border-slate-800 bg-slate-900/50 backdrop-blur p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm mb-1">Total Bookings</p>
                    <p className="text-3xl font-bold text-white">{stats.totalBookings}</p>
                  </div>
                  <Users className="h-8 w-8 text-purple-400 opacity-50" />
                </div>
              </div>

              <div className="rounded-lg border border-slate-800 bg-slate-900/50 backdrop-blur p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm mb-1">Completed</p>
                    <p className="text-3xl font-bold text-white">{stats.totalCompleted}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-400 opacity-50" />
                </div>
              </div>

              <div className="rounded-lg border border-slate-800 bg-slate-900/50 backdrop-blur p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm mb-1">Rating</p>
                    <p className="text-3xl font-bold text-white">{stats.averageRating.toFixed(1)}/5</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-yellow-400 opacity-50" />
                </div>
              </div>
            </div>
          )}

          {/* Today's Bookings */}
          <div className="rounded-lg border border-slate-800 bg-slate-900/50 backdrop-blur p-8">
            <h2 className="text-2xl font-bold text-white mb-6">Today&apos;s Appointments</h2>

            {bookings.length === 0 ? (
              <p className="text-slate-400 text-center py-8">No appointments today</p>
            ) : (
              <div className="space-y-4">
                {bookings.map((booking) => (
                  <div key={booking.id} className="rounded-lg border border-slate-700 bg-slate-800/30 p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-white">{getCustomerName(booking)}</h3>
                        <span className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-medium ${
                          booking.status === 'completed'
                            ? 'bg-green-600/20 text-green-300'
                            : booking.status === 'confirmed'
                              ? 'bg-blue-600/20 text-blue-300'
                              : 'bg-yellow-600/20 text-yellow-300'
                        }`}>
                          {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                        </span>
                      </div>
                      {booking.status !== 'completed' && booking.status !== 'cancelled' && (
                        <Button
                          size="sm"
                          onClick={() => handleBookingStatus(booking.id, 'completed')}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Mark Complete
                        </Button>
                      )}
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
                      <div>
                        <p className="text-xs text-slate-400 mb-1">Time</p>
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-4 w-4 text-indigo-400" />
                          <span className="text-sm text-white font-medium">{formatTimeWith12Hour(booking.appointmentTime)}</span>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs text-slate-400 mb-1">Phone</p>
                        <div className="flex items-center gap-1.5">
                          <Phone className="h-4 w-4 text-indigo-400" />
                          <span className="text-sm text-white font-medium">{getCustomerPhone(booking)}</span>
                        </div>
                      </div>

                      <div className="sm:col-span-2 md:col-span-2">
                        <p className="text-xs text-slate-400 mb-1">Email</p>
                        <div className="flex items-center gap-1.5">
                          <Mail className="h-4 w-4 text-indigo-400" />
                          <span className="text-sm text-white truncate">{getCustomerEmail(booking)}</span>
                        </div>
                      </div>

                      <BookingServices services={booking.services} className="sm:col-span-2 md:col-span-4" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Bookings */}
          <div className="rounded-lg border border-slate-800 bg-slate-900/50 backdrop-blur p-8 mt-8">
            <h2 className="text-2xl font-bold text-white mb-6">Upcoming Appointments</h2>

            {upcomingBookings.length === 0 ? (
              <p className="text-slate-400 text-center py-8">No upcoming appointments</p>
            ) : (
              <div className="space-y-4">
                {upcomingBookings.map((booking) => (
                  <div key={booking.id} className="rounded-lg border border-slate-700 bg-slate-800/30 p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-white">{getCustomerName(booking)}</h3>
                        <span className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-medium ${
                          booking.status === 'completed'
                            ? 'bg-green-600/20 text-green-300'
                            : booking.status === 'confirmed'
                              ? 'bg-blue-600/20 text-blue-300'
                              : 'bg-yellow-600/20 text-yellow-300'
                        }`}>
                          {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                        </span>
                      </div>
                      {booking.status !== 'completed' && booking.status !== 'cancelled' && (
                        <Button
                          size="sm"
                          onClick={() => handleBookingStatus(booking.id, 'completed')}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Mark Complete
                        </Button>
                      )}
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
                      <div>
                        <p className="text-xs text-slate-400 mb-1">Date</p>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-4 w-4 text-indigo-400" />
                          <span className="text-sm text-white font-medium">{formatAppointmentDate(booking.appointmentDate)}</span>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs text-slate-400 mb-1">Time</p>
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-4 w-4 text-indigo-400" />
                          <span className="text-sm text-white font-medium">{formatTimeWith12Hour(booking.appointmentTime)}</span>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs text-slate-400 mb-1">Phone</p>
                        <div className="flex items-center gap-1.5">
                          <Phone className="h-4 w-4 text-indigo-400" />
                          <span className="text-sm text-white font-medium">{getCustomerPhone(booking)}</span>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs text-slate-400 mb-1">Email</p>
                        <div className="flex items-center gap-1.5">
                          <Mail className="h-4 w-4 text-indigo-400" />
                          <span className="text-sm text-white truncate">{getCustomerEmail(booking)}</span>
                        </div>
                      </div>

                      <BookingServices services={booking.services} className="sm:col-span-2 md:col-span-4" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Customer Reviews */}
          <div className="rounded-lg border border-slate-800 bg-slate-900/50 backdrop-blur p-8 mt-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white">Customer Reviews</h2>
                {stats && stats.averageRating > 0 && (
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <span
                          key={i}
                          className={`text-lg ${i < Math.floor(stats.averageRating) ? 'text-yellow-400' : 'text-slate-600'}`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                    <span className="text-sm text-slate-300">
                      {stats.averageRating} ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})
                    </span>
                  </div>
                )}
              </div>
            </div>

            {reviews.length === 0 ? (
              <p className="text-slate-400 text-center py-8">No reviews yet. Great reviews from customers will appear here!</p>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="rounded-lg border border-slate-700 bg-slate-800/30 p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-white">{review.userName}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <span
                                key={i}
                                className={`text-sm ${i < review.rating ? 'text-yellow-400' : 'text-slate-600'}`}
                              >
                                ★
                              </span>
                            ))}
                          </div>
                          <span className="text-xs text-slate-400">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="text-slate-300 text-sm">{review.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
