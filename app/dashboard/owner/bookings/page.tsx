'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Navigation from '@/components/navigation'
import { Button } from '@/components/ui/button'
import { Calendar, CheckCircle, Clock, Phone, Mail, ChevronDown, Scissors, MessageCircle } from 'lucide-react'
import { formatTimeWith12Hour, formatAppointmentDate } from '@/lib/utils'
import SentimentDashboard from '@/components/SentimentDashboard' // 🤖 AI Dashboard Import
import { createChatRoom } from '@/lib/db-chat-service'

interface Booking {
  id: string
  bookingId: string
  userId: string
  salonId: string
  staffId?: string | null
  customerName: string
  customerEmail: string
  customerPhone: string
  appointmentDate: string
  appointmentTime: string
  services?: string[]
  notes: string
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
}

interface Salon {
  id: string
  name: string
  address: string
  phone: string
}

function BookingServices({ services }: { services?: string[] }) {
  const selectedServices = (services ?? []).filter(Boolean)

  if (selectedServices.length === 0) {
    return null
  }

  return (
    <div className="md:col-span-2">
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

export default function OwnerBookingsPage() {
  const router = useRouter()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [salons, setSalons] = useState<Map<string, Salon>>(new Map())
  const [loading, setLoading] = useState(true)
  const [expandedBooking, setExpandedBooking] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<'all' | 'confirmed' | 'cancelled' | 'completed'>('all')
  const [message, setMessage] = useState('')

  const fetchBookings = useCallback(async (ownerId: string) => {
    try {
      setLoading(true)
      setMessage('')

      // Get all salons for this owner
      const salonsRes = await fetch(`/api/salons?ownerId=${encodeURIComponent(ownerId)}`)
      const salonsJson = await salonsRes.json()
      const ownerSalons: Salon[] = Array.isArray(salonsJson) ? salonsJson : []

      if (ownerSalons.length === 0) {
        setMessage('No salon profile found. Create one to view bookings.')
        return
      }

      // Create a map of salonId to salon data
      const salonMap = new Map<string, Salon>()
      ownerSalons.forEach(salon => {
        salonMap.set(salon.id, salon)
      })
      setSalons(salonMap)

      // Fetch bookings for all owner's salons
      const allBookings: Booking[] = []
      for (const salon of ownerSalons) {
        const bookingsRes = await fetch(`/api/bookings/salon/${salon.id}`)
        if (bookingsRes.ok) {
          const bookingsData = await bookingsRes.json()
          allBookings.push(...(Array.isArray(bookingsData) ? bookingsData : []))
        }
      }

      // Sort by date descending
      allBookings.sort((a, b) => new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime())
      setBookings(allBookings)

      if (allBookings.length === 0) {
        setMessage('No bookings yet.')
      }
    } catch (error) {
      console.error('Failed to fetch bookings:', error)
      setMessage('Error loading bookings. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const userId = localStorage.getItem('authToken')
    if (!userId) {
      router.push('/auth/login')
      return
    }
    fetchBookings(userId)
  }, [fetchBookings, router])

  const handleBookingStatus = async (bookingId: string, status: Booking['status']) => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error || 'Failed to update booking')
      }

      setBookings((currentBookings) =>
        currentBookings.map((booking) =>
          booking.id === bookingId ? { ...booking, status } : booking
        )
      )
      alert('Booking status updated')
    } catch (error) {
      console.error('Update booking status error:', error)
      alert(error instanceof Error ? error.message : 'Failed to update booking')
    }
  }

  const handleStartChat = async (booking: Booking) => {
    try {
      const salonId = localStorage.getItem('salonId')
      if (!salonId) {
        alert('Salon not found. Please refresh the page.')
        return
      }

      // Create or get existing chat room
      const chatRoom = await createChatRoom({
        bookingId: booking.id,
        userId: booking.userId,
        salonId: booking.salonId,
        staffId: booking.staffId || undefined,
        participants: [booking.userId, booking.salonId],
      })

      // Navigate to chat page
      router.push('/dashboard/owner/chat')
    } catch (error) {
      console.error('Failed to start chat:', error)
      alert('Failed to start chat. Please try again.')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-500/10 border-green-500/30 text-green-400'
      case 'cancelled':
        return 'bg-red-500/10 border-red-500/30 text-red-400'
      case 'completed':
        return 'bg-blue-500/10 border-blue-500/30 text-blue-400'
      default:
        return 'bg-slate-500/10 border-slate-500/30 text-slate-400'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return '✓'
      case 'cancelled':
        return '✕'
      case 'completed':
        return '✓✓'
      default:
        return '◦'
    }
  }

  const filteredBookings = bookings.filter(b => filterStatus === 'all' || b.status === filterStatus)

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900">
        <Navigation />
        <div className="flex items-center justify-center py-12">
          <p className="text-slate-400">Loading bookings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900">
      <Navigation />

      <section className="px-6 py-12">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">My Bookings & AI Analytics</h1>
            <p className="text-slate-400">Manage all customer appointments and view AI sentiment insights</p>
          </div>

          {message && (
            <div className="mb-6 p-4 rounded-lg bg-slate-800 border border-slate-700 text-slate-300">
              {message}
            </div>
          )}

          {/* 🤖 AI SENTIMENT DASHBOARD INJECTED HERE */}
          {salons.size > 0 && (
            <div className="mb-12 space-y-8">
              {Array.from(salons.values()).map(salon => (
                <div key={salon.id}>
                  <SentimentDashboard salonId={salon.id} />
                </div>
              ))}
            </div>
          )}

          {/* Filter Status */}
          <div className="mb-6 flex gap-2 flex-wrap">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filterStatus === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              All ({bookings.length})
            </button>
            <button
              onClick={() => setFilterStatus('confirmed')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filterStatus === 'confirmed'
                  ? 'bg-green-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Confirmed ({bookings.filter(b => b.status === 'confirmed').length})
            </button>
            <button
              onClick={() => setFilterStatus('completed')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filterStatus === 'completed'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Completed ({bookings.filter(b => b.status === 'completed').length})
            </button>
            <button
              onClick={() => setFilterStatus('cancelled')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filterStatus === 'cancelled'
                  ? 'bg-red-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Cancelled ({bookings.filter(b => b.status === 'cancelled').length})
            </button>
          </div>

          {/* Bookings List */}
          <div className="space-y-4">
            {filteredBookings.length === 0 ? (
              <div className="p-8 text-center rounded-lg border border-slate-700 bg-slate-900/50">
                <p className="text-slate-400">No bookings found.</p>
              </div>
            ) : (
              filteredBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="rounded-lg border border-slate-700 bg-slate-900/50 backdrop-blur overflow-hidden hover:border-slate-600 transition"
                >
                  <button
                    onClick={() => setExpandedBooking(expandedBooking === booking.id ? null : booking.id)}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-800/50 transition"
                  >
                    <div className="flex items-center gap-6 flex-1 text-left">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full border font-bold text-sm ${getStatusColor(booking.status)}`}>
                            {getStatusIcon(booking.status)}
                          </span>
                          <h3 className="text-lg font-semibold text-white truncate">{booking.customerName}</h3>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-400 flex-wrap">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {formatAppointmentDate(booking.appointmentDate)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {formatTimeWith12Hour(booking.appointmentTime)}
                          </div>
                        </div>
                      </div>
                    </div>
                    <ChevronDown
                      className={`h-5 w-5 text-slate-400 transition-transform ${
                        expandedBooking === booking.id ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {/* Expanded Details */}
                  {expandedBooking === booking.id && (
                    <div className="px-6 py-6 border-t border-slate-700 bg-slate-800/30">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <p className="text-sm text-slate-400 mb-1">Salon</p>
                          <p className="text-white font-medium">{salons.get(booking.salonId)?.name || 'Unknown Salon'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-400 mb-1">Status</p>
                          <p className={`font-medium capitalize ${getStatusColor(booking.status).replace('bg-', 'text-').replace('/10', '').replace('/30', '')}`}>
                            {booking.status}
                          </p>
                        </div>

                        {booking.staffId && (
                          <div>
                            <p className="text-sm text-slate-400 mb-1">Assigned Stylist</p>
                            <p className="text-white font-medium">Staff Member #{booking.staffId.slice(0, 8)}</p>
                          </div>
                        )}

                        <BookingServices services={booking.services} />
                        <div className="md:col-span-2">
                          <p className="text-sm text-slate-400 mb-3">Contact Information</p>
                          <div className="space-y-2">
                            <div className="flex items-center gap-3">
                              <Phone className="h-4 w-4 text-indigo-400 flex-shrink-0" />
                              <a href={`tel:${booking.customerPhone}`} className="text-slate-300 hover:text-indigo-400">
                                {booking.customerPhone}
                              </a>
                            </div>
                            <div className="flex items-center gap-3">
                              <Mail className="h-4 w-4 text-indigo-400 flex-shrink-0" />
                              <a href={`mailto:${booking.customerEmail}`} className="text-slate-300 hover:text-indigo-400">
                                {booking.customerEmail}
                              </a>
                            </div>
                          </div>
                        </div>
                        {booking.notes && (
                          <div className="md:col-span-2">
                            <p className="text-sm text-slate-400 mb-1">Notes</p>
                            <p className="text-slate-300">{booking.notes}</p>
                          </div>
                        )}
                        <div className="md:col-span-2 flex gap-3 justify-end">
                          <Button
                            size="sm"
                            onClick={() => handleStartChat(booking)}
                            className="bg-purple-600 hover:bg-purple-700 flex items-center gap-2"
                          >
                            <MessageCircle className="h-4 w-4" />
                            Chat with Customer
                          </Button>
                          {booking.status !== 'completed' && booking.status !== 'cancelled' && (
                            <Button
                              size="sm"
                              onClick={() => handleBookingStatus(booking.id, 'completed')}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Mark Complete
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  )
}