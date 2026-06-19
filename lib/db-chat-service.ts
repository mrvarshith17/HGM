/**
 * Chat service for real-time messaging
 * Handles chat room and message operations
 */

export interface ChatRoom {
  id: string
  chatRoomId: string
  bookingId: string
  userId: string
  salonId: string
  staffId?: string
  participants: string[]
  createdAt: string | Date
  updatedAt: string | Date
  lastMessage?: string
  lastMessageTime?: string | Date
}

export interface ChatMessage {
  id: string
  messageId: string
  chatRoomId: string
  senderId: string
  senderType: 'user' | 'owner' | 'staff'
  senderName: string
  message: string
  timestamp: string | Date
  read: boolean
}

export async function createChatRoom(roomData: Omit<ChatRoom, 'id' | 'chatRoomId' | 'createdAt' | 'updatedAt'>) {
  try {
    // Get auth token from localStorage for client-side requests
    const authToken = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null
    
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`
    }

    console.log('[Chat Service] Creating chat room with:', roomData)

    // Try local API first (memory-based, no Firestore auth required)
    const response = await fetch('/api/chat/local-rooms', {
      method: 'POST',
      headers,
      body: JSON.stringify(roomData),
    })

    const responseData = await response.json()

    if (!response.ok) {
      console.error('[Chat Service] API error response:', responseData)
      throw new Error(responseData.error || `Failed to create chat room: ${response.status}`)
    }

    console.log('[Chat Service] Chat room created successfully:', responseData.id)
    return responseData
  } catch (error) {
    console.error('[Chat Service] createChatRoom error:', error instanceof Error ? error.message : error)
    throw error
  }
}

export async function getChatRoom(chatRoomId: string) {
  const authToken = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null
  
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`
  }

  const response = await fetch(`/api/chat/rooms/${chatRoomId}`, {
    method: 'GET',
    headers,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch chat room')
  }

  return response.json()
}

export async function getUserChatRooms(userId: string) {
  const authToken = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null
  
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`
  }

  try {
    // Use local API (memory-based, no Firestore auth required)
    const response = await fetch(`/api/chat/local-rooms?userId=${encodeURIComponent(userId)}`, {
      method: 'GET',
      headers,
    })

    const responseData = await response.json()

    // Always treat as success (even if empty data)
    if (response.ok) {
      console.log('[Chat Service] Fetched chat rooms:', responseData.data?.length || 0)
      return responseData.data || []
    }

    console.warn('[Chat Service] API returned non-ok status, using empty array')
    return []
  } catch (error) {
    console.error('[Chat Service] getUserChatRooms error:', error instanceof Error ? error.message : error)
    // Return empty array instead of throwing
    return []
  }
}

export async function getSalonChatRooms(salonId: string) {
  try {
    // Validate salonId is a non-empty string
    if (!salonId) {
      console.warn('[Chat Service] getSalonChatRooms called with missing salonId')
      return []
    }

    if (typeof salonId !== 'string') {
      console.warn('[Chat Service] getSalonChatRooms called with non-string salonId:', typeof salonId)
      return []
    }

    const trimmedId = salonId.trim()
    if (trimmedId === '') {
      console.warn('[Chat Service] getSalonChatRooms called with empty salonId')
      return []
    }

    console.log('[Chat Service] Fetching chat rooms for salon:', trimmedId)
    const response = await fetch(`/api/chat/local-salon-rooms/${encodeURIComponent(trimmedId)}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to fetch' }))
      console.warn('[Chat Service] API error:', error, 'Status:', response.status)
      return []
    }

    const data = await response.json()
    console.log('[Chat Service] Got chat rooms response:', data)
    return data.data || []
  } catch (error) {
    console.error('[Chat Service] getSalonChatRooms error:', error instanceof Error ? error.message : error)
    return []
  }
}

export async function getChatMessages(chatRoomId: string) {
  try {
    // Validate chatRoomId
    if (!chatRoomId || typeof chatRoomId !== 'string' || chatRoomId.trim() === '') {
      console.warn('[Chat Service] getChatMessages called with invalid chatRoomId')
      return { data: [] }
    }

    console.log('[Chat Service] Fetching messages for room:', chatRoomId)
    
    // Use local API (memory-based, no Firestore auth required)
    const response = await fetch(`/api/chat/local-messages/${encodeURIComponent(chatRoomId)}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to fetch' }))
      console.warn('[Chat Service] API error:', error, 'Status:', response.status)
      return { data: [] }
    }

    const data = await response.json()
    console.log('[Chat Service] Got', data.data?.length || 0, 'messages')
    return data
  } catch (error) {
    console.error('[Chat Service] getChatMessages error:', error instanceof Error ? error.message : error)
    return { data: [] }
  }
}

export async function sendMessage(messageData: Omit<ChatMessage, 'id' | 'messageId' | 'timestamp' | 'read'>) {
  try {
    // Validate required fields
    const { chatRoomId, senderId, senderType, message } = messageData
    if (!chatRoomId || !senderId || !senderType || !message) {
      console.error('[Chat Service] sendMessage called with incomplete data:', { chatRoomId, senderId, senderType, message: !!message })
      throw new Error('chatRoomId, senderId, senderType, and message are required')
    }

    console.log('[Chat Service] Sending message to room:', chatRoomId)
    
    // Use local API (memory-based, no Firestore auth required)
    const response = await fetch('/api/chat/local-messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(messageData),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to send' }))
      console.error('[Chat Service] API error:', error, 'Status:', response.status)
      throw new Error(error.error || 'Failed to send message')
    }

    const data = await response.json()
    console.log('[Chat Service] Message sent successfully:', data.messageId)
    return data
  } catch (error) {
    console.error('[Chat Service] sendMessage error:', error instanceof Error ? error.message : error)
    throw error
  }
}

export async function markMessagesAsRead(chatRoomId: string, userId: string) {
  try {
    if (!chatRoomId || !userId) {
      console.warn('[Chat Service] markMessagesAsRead called with incomplete data')
      return { success: false }
    }

    const response = await fetch(`/api/chat/rooms/${chatRoomId}/mark-read`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to mark as read' }))
      console.warn('[Chat Service] API error:', error)
      return { success: false }
    }

    return response.json()
  } catch (error) {
    console.error('[Chat Service] markMessagesAsRead error:', error instanceof Error ? error.message : error)
    return { success: false }
  }
}
