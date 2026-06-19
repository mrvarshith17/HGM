/**
 * Local staff service using file-based storage
 * Handles all staff member operations without external database
 */

export interface Staff {
  id: string
  staffId: string
  salonId: string
  name: string
  specialization: string
  bio?: string
  profilePicture?: string
  services: string[]
  yearsExperience?: number
  certifications?: string[]
  availability?: Record<string, { start: string; end: string }>
  rating: number
  reviewCount: number
  createdAt: string | Date
  updatedAt: string | Date
}

export async function addStaffMember(salonId: string, staffData: Omit<Staff, 'id' | 'staffId' | 'createdAt' | 'updatedAt'>) {
  try {
    const response = await fetch(`/api/salons/${salonId}/staff-local`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(staffData),
    })

    if (!response.ok) {
      let errorMessage = 'Failed to add staff member'
      try {
        const error = await response.json()
        errorMessage = error.error || error.message || errorMessage
      } catch {
        errorMessage = `HTTP ${response.status}: ${response.statusText || 'Unknown error'}`
      }
      throw new Error(errorMessage)
    }

    return response.json()
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Failed to add staff member: Unknown error')
  }
}

export async function getSalonStaff(salonId: string) {
  try {
    const response = await fetch(`/api/salons/${salonId}/staff-local`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })

    if (!response.ok) {
      let errorMessage = 'Failed to fetch staff members'
      try {
        const error = await response.json()
        errorMessage = error.error || error.message || errorMessage
      } catch {
        errorMessage = `HTTP ${response.status}: ${response.statusText || 'Unknown error'}`
      }
      throw new Error(errorMessage)
    }

    return response.json()
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Failed to fetch staff members: Unknown error')
  }
}

export async function getStaffMember(salonId: string, staffId: string) {
  try {
    const response = await fetch(`/api/salons/${salonId}/staff-local/${staffId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })

    if (!response.ok) {
      let errorMessage = 'Failed to fetch staff member'
      try {
        const error = await response.json()
        errorMessage = error.error || error.message || errorMessage
      } catch {
        errorMessage = `HTTP ${response.status}: ${response.statusText || 'Unknown error'}`
      }
      throw new Error(errorMessage)
    }

    return response.json()
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Failed to fetch staff member: Unknown error')
  }
}

export async function updateStaffMember(salonId: string, staffId: string, staffData: Partial<Staff>) {
  try {
    const response = await fetch(`/api/salons/${salonId}/staff-local/${staffId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(staffData),
    })

    if (!response.ok) {
      let errorMessage = 'Failed to update staff member'
      try {
        const error = await response.json()
        errorMessage = error.error || error.message || errorMessage
      } catch {
        errorMessage = `HTTP ${response.status}: ${response.statusText || 'Unknown error'}`
      }
      throw new Error(errorMessage)
    }

    return response.json()
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Failed to update staff member: Unknown error')
  }
}

export async function deleteStaffMember(salonId: string, staffId: string) {
  try {
    const response = await fetch(`/api/salons/${salonId}/staff-local/${staffId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    })

    if (!response.ok) {
      let errorMessage = 'Failed to delete staff member'
      try {
        const error = await response.json()
        errorMessage = error.error || error.message || errorMessage
      } catch {
        errorMessage = `HTTP ${response.status}: ${response.statusText || 'Unknown error'}`
      }
      throw new Error(errorMessage)
    }

    return response.json()
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Failed to delete staff member: Unknown error')
  }
}
