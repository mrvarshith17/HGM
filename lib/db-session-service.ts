/**
 * Database-backed session service
 * Replaces localStorage with persistent database storage for all user sessions
 */

export interface UserSession {
  userId: string
  email: string
  name: string
  phone: string
  userType: 'customer' | 'salon_owner'
  profilePicture?: string
  salonId?: string // For salon owners
  sessionToken: string
  createdAt: string
  expiresAt: string
}

export async function createSession(userData: {
  userId: string
  email: string
  name: string
  phone: string
  userType: 'customer' | 'salon_owner'
  salonId?: string
  profilePicture?: string
}): Promise<UserSession> {
  const response = await fetch('/api/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to create session')
  }

  return response.json()
}

export async function getSession(userId: string): Promise<UserSession> {
  const response = await fetch(`/api/sessions/${userId}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch session')
  }

  return response.json()
}

export async function updateSession(userId: string, updates: Partial<UserSession>): Promise<UserSession> {
  const response = await fetch(`/api/sessions/${userId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to update session')
  }

  return response.json()
}

export async function deleteSession(userId: string): Promise<void> {
  const response = await fetch(`/api/sessions/${userId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to delete session')
  }
}

/**
 * Helper function to get current user from database session
 * Used in client components instead of reading from localStorage
 */
export async function getCurrentUser(): Promise<UserSession | null> {
  try {
    // Get userId from session token cookie or fallback
    const response = await fetch('/api/auth/me', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })

    if (!response.ok) {
      return null
    }

    return response.json()
  } catch (error) {
    console.error('Failed to get current user:', error)
    return null
  }
}
