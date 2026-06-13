/**
 * Database-backed hairstyle preview service
 * Stores generated hairstyle previews in the database
 */

export interface HairstylePreview {
  id: string
  userId: string
  originalImage: string
  hairstyleDescription: string
  previewImage: string
  createdAt: string | Date
}

export async function saveHairstylePreview(userId: string, data: {
  originalImage: string
  hairstyleDescription: string
  previewImage: string
}) {
  const response = await fetch('/api/hairstyle-preview/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId,
      ...data,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to save preview')
  }

  return response.json()
}

export async function getUserHairstylePreviews(userId: string) {
  const response = await fetch(`/api/hairstyle-preview/user/${userId}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch previews')
  }

  return response.json()
}

export async function deleteHairstylePreview(previewId: string) {
  const response = await fetch(`/api/hairstyle-preview/${previewId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to delete preview')
  }

  return response.json()
}
