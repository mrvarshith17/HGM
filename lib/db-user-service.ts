/**
 * Database-backed user service
 * All user profile operations use the database (via API) instead of localStorage
 */

export interface UserProfile {
  uid: string
  email: string
  name: string
  phone: string
  userType: 'customer' | 'salon_owner'
  profilePicture?: string
  address?: string
  bio?: string
  createdAt?: string | Date
  updatedAt?: string | Date
}

export async function getUserProfile(userId: string) {
  const response = await fetch(`/api/users/${userId}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch user profile')
  }

  return response.json()
}

export async function updateUserProfile(userId: string, profileData: Partial<UserProfile>) {
  const response = await fetch(`/api/users/${userId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profileData),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to update user profile')
  }

  return response.json()
}

export async function getFavoriteSalons(userId: string) {
  const response = await fetch(`/api/users/${userId}/favorites`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch favorite salons')
  }

  return response.json()
}

export async function addFavoriteSalon(userId: string, salonId: string) {
  const response = await fetch(`/api/users/${userId}/favorites`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ salonId }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to add favorite salon')
  }

  return response.json()
}

export async function removeFavoriteSalon(userId: string, salonId: string) {
  const response = await fetch(`/api/users/${userId}/favorites/${salonId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to remove favorite salon')
  }

  return response.json()
}
