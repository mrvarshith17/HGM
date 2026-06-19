/**
 * Database-backed salon service
 * All salon operations use the database (via API) instead of localStorage
 */

export interface Salon {
  id: string
  ownerId: string
  name: string
  address: string
  phone: string
  description: string
  city: string
  email: string
  rating: number
  reviewCount: number
  services: string[]
  staffMembers?: string[]
  profilePicture?: string
  operatingHours?: Record<string, string>
  createdAt?: string | Date
  updatedAt?: string | Date
}

export async function getSalons(ownerId?: string) {
  const url = new URL('/api/salons', typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000')
  if (ownerId) {
    url.searchParams.append('ownerId', ownerId)
  }

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch salons')
  }

  return response.json()
}

export async function getSalon(salonId: string) {
  const response = await fetch(`/api/salons/${salonId}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch salon')
  }

  return response.json()
}

export async function createSalon(salonData: Omit<Salon, 'id' | 'createdAt' | 'updatedAt'>) {
  const response = await fetch('/api/salons', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(salonData),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to create salon')
  }

  return response.json()
}

export async function updateSalon(salonId: string, salonData: Partial<Salon>) {
  const response = await fetch(`/api/salons/${salonId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(salonData),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to update salon')
  }

  return response.json()
}

export async function deleteSalon(salonId: string) {
  const response = await fetch(`/api/salons/${salonId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to delete salon')
  }

  return response.json()
}

export async function getSalonsByCity(city: string) {
  const response = await fetch(`/api/salons?city=${encodeURIComponent(city)}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch salons by city')
  }

  return response.json()
}
