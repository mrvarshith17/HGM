'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Navigation from '@/components/navigation'
import { Button } from '@/components/ui/button'
import { Check, MapPin, Phone, Mail, Scissors, Star, Calendar } from 'lucide-react'
import { getStarStates } from '@/lib/rating-utils'

interface Salon {
  id: string
  name: string
  address: string
  city: string
  phone: string
  email: string
  rating: number
  reviewCount: number
  services: string[]
  profilePicture?: string
  description: string
  operatingHours?: Record<string, string>
}

interface Review {
  id: string
  userId: string
  rating: number
  comment: string
  createdAt: string
}

export default function SalonDetailPage() {
  const params = useParams()
  const router = useRouter()
  const salonId = params.id as string

  const [salon, setSalon] = useState<Salon | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [appointmentDate, setAppointmentDate] = useState('')
  const [appointmentTime, setAppointmentTime] = useState('')
  const [timePeriod, setTimePeriod] = useState('AM')
  const [notes, setNotes] = useState('')
  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const [bookingLoading, setBookingLoading] = useState(false)

  const fetchSalonDetails = useCallback(async () => {
    try {
      setLoading(true)
      const [salonRes, reviewsRes] = await Promise.all([
        fetch(`/api/salons/${salonId}`),
        fetch(`/api/salons/${salonId}/reviews`),
      ])

      if (salonRes.ok) {
        const salonData = await salonRes.json()
        setSalon(salonData)
      }

      if (reviewsRes.ok) {
        const reviewsData = await reviewsRes.json()
        setReviews(reviewsData)
      }
    } catch (error) {
      console.error('Failed to fetch salon details:', error)
    } finally {
      setLoading(false)
    }
  }, [salonId])

  useEffect(() => {
    fetchSalonDetails()
  }, [fetchSalonDetails])

  useEffect(() => {
    const handleReviewSubmitted = (event: Event) => {
      const customEvent = event as CustomEvent
      console.log('Salon detail page received review submission event for:', customEvent.detail?.salonId)
      if (customEvent.detail?.salonId === salonId) {
        console.log('Refreshing salon details for:', salonId)
        fetchSalonDetails()
      }
    }
    
    window.addEventListener('salonReviewSubmitted', handleReviewSubmitted)
    return () => window.removeEventListener('salonReviewSubmitted', handleReviewSubmitted)
  }, [fetchSalonDetails, salonId])

  const toggleService = (service: string) => {
    setSelectedServices((currentServices) =>
      currentServices.includes(service)
        ? currentServices.filter((currentService) => currentService !== service)
        : [...currentServices, service]
    )
  }

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault()
    const userId = localStorage.getItem('authToken')

    if (!userId) {
      router.push('/auth/login')
      return
    }

    if (!customerName.trim() || !customerPhone.trim() || !customerEmail.trim()) {
      alert('Please provide your name, email and phone number')
      return
    }

    if (!appointmentDate || !appointmentTime) {
      alert('Please select a date and time for your appointment')
      return
    }

    const availableServices = salon?.services ?? []
    if (availableServices.length > 0 && selectedServices.length === 0) {
      alert('Please select at least one service for your booking')
      return
    }

    try {
      setBookingLoading(true)
      const formattedTime = `${appointmentTime} ${timePeriod}`
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          salonId,
          salonName: salon?.name,
          customerName,
          customerEmail,
          customerPhone,
          appointmentDate,
          appointmentTime: formattedTime,
          serviceId: selectedServices[0] ?? null,
          services: selectedServices,
          notes,
        }),
      })

      if (response.ok) {
        alert('Booking confirmed! Confirmation messages will be sent to your email and phone when notification providers are configured.')
        setCustomerName('')
        setCustomerEmail('')
        setCustomerPhone('')
        setAppointmentDate('')
        setAppointmentTime('')
        setTimePeriod('AM')
        setSelectedServices([])
        setNotes('')
        router.push('/dashboard/user')
      } else {
        alert('Booking failed. Please try again.')
      }
    } catch (error) {
      console.error('Booking error:', error)
      alert('An error occurred. Please try again.')
    } finally {
      setBookingLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900">
        <Navigation />
        <div className="flex items-center justify-center py-12">
          <p className="text-slate-400">Loading salon details...</p>
        </div>
      </div>
    )
  }

  if (!salon) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900">
        <Navigation />
        <div className="flex items-center justify-center py-12">
          <p className="text-slate-400">Salon not found.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900">
      <Navigation />

      <section className="px-6 py-12">
        <div className="mx-auto max-w-4xl">
          {/* Salon Header */}
          <div className="mb-8 rounded-lg border border-slate-800 bg-slate-900/50 backdrop-blur overflow-hidden">
            <div className="h-64 bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
              {salon.profilePicture ? (
                <img src={salon.profilePicture} alt={salon.name} className="w-full h-full object-cover" />
              ) : (
                <div className="text-white text-6xl opacity-50">✂️</div>
              )}
            </div>

            <div className="p-8">
              <h1 className="text-4xl font-bold text-white mb-4">{salon.name}</h1>

              <div className="flex items-center gap-4 mb-6 flex-wrap">
                <div className="flex items-center gap-2">
                  {getStarStates(salon.rating).map((state, i) => (
                    <div key={i} className="relative h-5 w-5">
                      <Star className="h-5 w-5 text-slate-600" />
                      {(state === 'full' || state === 'half') && (
                        <div className="absolute top-0 left-0 h-5 overflow-hidden" style={{ width: state === 'full' ? '100%' : '50%' }}>
                          <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                        </div>
                      )}
                    </div>
                  ))}
                  <span className="text-white font-semibold">{salon.rating.toFixed(1)}</span>
                  <span className="text-slate-400">({salon.reviewCount} reviews)</span>
                </div>
              </div>

              {salon.description && (
                <p className="text-slate-300 mb-6">{salon.description}</p>
              )}

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-slate-300">
                  <MapPin className="h-5 w-5 text-indigo-400 flex-shrink-0" />
                  <span>{salon.address}, {salon.city}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-300">
                  <Phone className="h-5 w-5 text-indigo-400 flex-shrink-0" />
                  <a href={`tel:${salon.phone}`} className="hover:text-indigo-400">{salon.phone}</a>
                </div>
                <div className="flex items-center gap-3 text-slate-300">
                  <Mail className="h-5 w-5 text-indigo-400 flex-shrink-0" />
                  <a href={`mailto:${salon.email}`} className="hover:text-indigo-400">{salon.email}</a>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Services */}
            <div className="lg:col-span-2 space-y-8">
              <div className="rounded-lg border border-slate-800 bg-slate-900/50 backdrop-blur p-8">
                <h2 className="text-2xl font-bold text-white mb-6">Services Offered</h2>
                {salon.services.length === 0 ? (
                  <p className="text-slate-400">No services listed yet.</p>
                ) : (
                  <div className="grid gap-3">
                    {salon.services.map((service) => (
                      <div key={service} className="flex items-center gap-3 p-4 rounded-lg bg-indigo-600/10 border border-indigo-600/20">
                        <Scissors className="h-5 w-5 text-indigo-300" />
                        <span className="text-white">{service}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Reviews */}
              <div className="rounded-lg border border-slate-800 bg-slate-900/50 backdrop-blur p-8">
                <h2 className="text-2xl font-bold text-white mb-6">Recent Reviews</h2>
                <div className="space-y-4">
                  {reviews.length === 0 ? (
                    <p className="text-slate-400">No reviews yet.</p>
                  ) : (
                    reviews.map((review) => (
                      <div key={review.id} className="border-b border-slate-700 pb-4 last:border-0">
                        <div className="flex items-center gap-2 mb-2">
                          {getStarStates(review.rating).map((state, i) => (
                            <div key={i} className="relative h-4 w-4">
                              <Star className="h-4 w-4 text-slate-600" />
                              {(state === 'full' || state === 'half') && (
                                <div className="absolute top-0 left-0 h-4 overflow-hidden" style={{ width: state === 'full' ? '100%' : '50%' }}>
                                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                        <p className="text-slate-300">{review.comment}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Booking Form */}
            <div className="rounded-lg border border-slate-800 bg-slate-900/50 backdrop-blur p-8 h-fit">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <Calendar className="h-6 w-6" />
                Book Appointment
              </h2>

              <form onSubmit={handleBooking} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Full Name *</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-slate-700 bg-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter your full name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">Phone Number *</label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-slate-700 bg-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter your phone number"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">Email *</label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-slate-700 bg-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter your email"
                    required
                  />
                </div>

                {salon.services.length > 0 && (
                  <div>
                    <p className="block text-sm font-medium text-white mb-2">Services *</p>
                    <div className="grid gap-2">
                      {salon.services.map((service) => {
                        const selected = selectedServices.includes(service)

                        return (
                          <label
                            key={service}
                            className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 transition ${
                              selected
                                ? 'border-indigo-500 bg-indigo-500/15 text-white'
                                : 'border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-600'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={selected}
                              onChange={() => toggleService(service)}
                              className="sr-only"
                            />
                            <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                              selected ? 'border-indigo-400 bg-indigo-500' : 'border-slate-500 bg-slate-900'
                            }`}>
                              {selected && <Check className="h-4 w-4 text-white" />}
                            </span>
                            <span className="text-sm font-medium">{service}</span>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-white mb-2">Date *</label>
                  <input
                    type="date"
                    value={appointmentDate}
                    onChange={(e) => setAppointmentDate(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-slate-700 bg-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">Time *</label>
                  <div className="flex gap-2">
                    <input
                      type="time"
                      value={appointmentTime}
                      onChange={(e) => setAppointmentTime(e.target.value)}
                      className="flex-1 px-4 py-2 rounded-lg border border-slate-700 bg-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                    <select
                      value={timePeriod}
                      onChange={(e) => setTimePeriod(e.target.value)}
                      className="px-4 py-2 rounded-lg border border-slate-700 bg-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="AM">AM</option>
                      <option value="PM">PM</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">Notes (Optional)</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-slate-700 bg-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                    rows={3}
                    placeholder="Any special requests?"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 h-11 mt-6"
                  disabled={bookingLoading}
                >
                  {bookingLoading ? 'Booking...' : 'Confirm Booking'}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
