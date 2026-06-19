/**
 * Database-backed temporary state service
 * Replaces localStorage for temporary UI state like quickBooking
 */

export interface QuickBooking {
  userId: string
  salonId: string
  staffId?: string
  serviceId?: string
  price?: number
  timestamp: string
  expiresAt: string
}

export async function saveQuickBooking(userId: string, bookingData: {
  salonId: string
  staffId?: string
  serviceId?: string
  price?: number
}): Promise<QuickBooking> {
  const response = await fetch(`/api/users/${userId}/quick-booking`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bookingData),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to save quick booking')
  }

  return response.json()
}

export async function getQuickBooking(userId: string): Promise<QuickBooking | null> {
  try {
    const response = await fetch(`/api/users/${userId}/quick-booking`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })

    if (!response.ok) {
      return null
    }

    return response.json()
  } catch (error) {
    console.error('Failed to get quick booking:', error)
    return null
  }
}

export async function clearQuickBooking(userId: string): Promise<void> {
  const response = await fetch(`/api/users/${userId}/quick-booking`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to clear quick booking')
  }
}
