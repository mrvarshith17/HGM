/**
 * Database-backed booking service
 * All booking operations use the database (via API) instead of localStorage
 */

export interface Booking {
  id: string
  bookingId: string
  userId: string
  salonId: string
  staffId?: string | null
  serviceId: string | null
  services?: string[]
  customerName?: string
  customerEmail?: string
  customerPhone?: string
  appointmentDate: string
  appointmentTime: string
  notes: string
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  createdAt: string | Date
  updatedAt: string | Date
  salon?: any
  user?: any
  staff?: any
}

export async function createBooking(bookingData: Omit<Booking, 'id' | 'bookingId' | 'createdAt' | 'updatedAt'>) {
  const response = await fetch('/api/bookings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bookingData),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to create booking')
  }

  return response.json()
}

export async function getUserBookings(userId: string) {
  const response = await fetch(`/api/bookings/user/${userId}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch user bookings')
  }

  return response.json()
}

export async function getSalonBookings(salonId: string) {
  const response = await fetch(`/api/bookings/salon/${salonId}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch salon bookings')
  }

  return response.json()
}

export async function getBooking(bookingId: string) {
  const response = await fetch(`/api/bookings/${bookingId}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch booking')
  }

  return response.json()
}

export async function updateBookingStatus(bookingId: string, status: string) {
  const response = await fetch(`/api/bookings/${bookingId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to update booking')
  }

  return response.json()
}

export async function cancelBooking(bookingId: string) {
  const response = await fetch(`/api/bookings/${bookingId}/cancel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to cancel booking')
  }

  return response.json()
}
