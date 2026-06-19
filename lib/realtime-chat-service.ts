/**
 * Real-time Chat Service using Firebase Realtime Database
 * Provides instant message delivery and live chat functionality
 */

import {
  ref,
  push,
  set,
  get,
  query,
  orderByChild,
  limitToLast,
  onValue,
  update,
  remove,
  Unsubscribe,
} from 'firebase/database'
import { getRealtimeDb, isRealtimeDbConfigured } from './firebase-client'

export interface RealtimeMessage {
  id: string
  chatRoomId: string
  senderId: string
  senderName: string
  senderType: 'user' | 'owner' | 'staff'
  message: string
  timestamp: number
  read: boolean
  readBy?: Record<string, boolean>
}

export interface RealtimeChatRoom {
  id: string
  bookingId: string
  userId: string
  salonId: string
  staffId?: string
  participants: string[]
  createdAt: number
  updatedAt: number
  lastMessage?: string
  lastMessageTime?: number
}

/**
 * Send a message to a chat room (real-time)
 */
export async function sendRealtimeMessage(
  chatRoomId: string,
  senderId: string,
  senderName: string,
  senderType: 'user' | 'owner' | 'staff',
  message: string
): Promise<RealtimeMessage> {
  const db = getRealtimeDb()
  if (!db) {
    throw new Error('Realtime Database not configured')
  }

  const messagesRef = ref(db, `chatRooms/${chatRoomId}/messages`)
  const newMessageRef = push(messagesRef)

  const messageData: Omit<RealtimeMessage, 'id'> = {
    chatRoomId,
    senderId,
    senderName,
    senderType,
    message,
    timestamp: Date.now(),
    read: false,
    readBy: { [senderId]: true },
  }

  await set(newMessageRef, messageData)

  // Update chat room's last message
  await update(ref(db, `chatRooms/${chatRoomId}`), {
    lastMessage: message,
    lastMessageTime: Date.now(),
    updatedAt: Date.now(),
  })

  return {
    id: newMessageRef.key || '',
    ...messageData,
  }
}

/**
 * Create a new chat room (real-time)
 */
export async function createRealtimeChatRoom(roomData: Omit<RealtimeChatRoom, 'id' | 'createdAt' | 'updatedAt'>): Promise<RealtimeChatRoom> {
  const db = getRealtimeDb()
  if (!db) {
    throw new Error('Realtime Database not configured')
  }

  const chatRoomsRef = ref(db, 'chatRooms')
  const newRoomRef = push(chatRoomsRef)

  const fullRoomData: Omit<RealtimeChatRoom, 'id'> = {
    ...roomData,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }

  await set(newRoomRef, fullRoomData)

  return {
    id: newRoomRef.key || '',
    ...fullRoomData,
  }
}

/**
 * Listen to messages in real-time
 */
export function subscribeToMessages(
  chatRoomId: string,
  onMessagesChange: (messages: RealtimeMessage[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const db = getRealtimeDb()
  if (!db) {
    const error = new Error('Realtime Database not configured')
    onError?.(error)
    return () => {}
  }

  const messagesRef = ref(db, `chatRooms/${chatRoomId}/messages`)

  return onValue(
    messagesRef,
    (snapshot) => {
      const data = snapshot.val()
      if (!data) {
        onMessagesChange([])
        return
      }

      const messages: RealtimeMessage[] = Object.entries(data).map(([key, value]: [string, any]) => ({
        id: key,
        ...value,
      }))

      // Sort by timestamp
      messages.sort((a, b) => a.timestamp - b.timestamp)
      onMessagesChange(messages)
    },
    (error) => {
      console.error('Failed to subscribe to messages:', error)
      onError?.(new Error(`Failed to subscribe to messages: ${error.message}`))
    }
  )
}

/**
 * Listen to chat room updates in real-time
 */
export function subscribeToChatRoom(
  chatRoomId: string,
  onRoomChange: (room: RealtimeChatRoom | null) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const db = getRealtimeDb()
  if (!db) {
    const error = new Error('Realtime Database not configured')
    onError?.(error)
    return () => {}
  }

  const roomRef = ref(db, `chatRooms/${chatRoomId}`)

  return onValue(
    roomRef,
    (snapshot) => {
      const data = snapshot.val()
      if (!data) {
        onRoomChange(null)
        return
      }

      onRoomChange({
        id: chatRoomId,
        ...data,
      })
    },
    (error) => {
      console.error('Failed to subscribe to chat room:', error)
      onError?.(new Error(`Failed to subscribe to chat room: ${error.message}`))
    }
  )
}

/**
 * Get messages for a chat room (one-time fetch)
 */
export async function getRealtimeMessages(chatRoomId: string): Promise<RealtimeMessage[]> {
  const db = getRealtimeDb()
  if (!db) {
    throw new Error('Realtime Database not configured')
  }

  const messagesRef = ref(db, `chatRooms/${chatRoomId}/messages`)
  const snapshot = await get(messagesRef)

  if (!snapshot.exists()) {
    return []
  }

  const data = snapshot.val()
  const messages: RealtimeMessage[] = Object.entries(data).map(([key, value]: [string, any]) => ({
    id: key,
    ...value,
  }))

  messages.sort((a, b) => a.timestamp - b.timestamp)
  return messages
}

/**
 * Get chat room details (one-time fetch)
 */
export async function getRealtimeChatRoom(chatRoomId: string): Promise<RealtimeChatRoom | null> {
  const db = getRealtimeDb()
  if (!db) {
    throw new Error('Realtime Database not configured')
  }

  const roomRef = ref(db, `chatRooms/${chatRoomId}`)
  const snapshot = await get(roomRef)

  if (!snapshot.exists()) {
    return null
  }

  return {
    id: chatRoomId,
    ...snapshot.val(),
  }
}

/**
 * Mark messages as read by a user
 */
export async function markMessagesAsRead(
  chatRoomId: string,
  userId: string,
  messageIds?: string[]
): Promise<void> {
  const db = getRealtimeDb()
  if (!db) {
    throw new Error('Realtime Database not configured')
  }

  if (messageIds && messageIds.length > 0) {
    // Mark specific messages as read
    const updates: Record<string, any> = {}
    messageIds.forEach((messageId) => {
      updates[`chatRooms/${chatRoomId}/messages/${messageId}/readBy/${userId}`] = true
    })
    await update(ref(db), updates)
  } else {
    // Mark all messages as read
    const messagesRef = ref(db, `chatRooms/${chatRoomId}/messages`)
    const snapshot = await get(messagesRef)

    if (!snapshot.exists()) {
      return
    }

    const updates: Record<string, any> = {}
    Object.keys(snapshot.val()).forEach((messageId) => {
      updates[`chatRooms/${chatRoomId}/messages/${messageId}/readBy/${userId}`] = true
    })

    if (Object.keys(updates).length > 0) {
      await update(ref(db), updates)
    }
  }
}

/**
 * Get user's chat rooms (one-time fetch)
 */
export async function getUserChatRooms(userId: string): Promise<RealtimeChatRoom[]> {
  const db = getRealtimeDb()
  if (!db) {
    throw new Error('Realtime Database not configured')
  }

  const chatRoomsRef = ref(db, 'chatRooms')
  const snapshot = await get(chatRoomsRef)

  if (!snapshot.exists()) {
    return []
  }

  const rooms: RealtimeChatRoom[] = Object.entries(snapshot.val())
    .filter(([, data]: [string, any]) => {
      return data.participants && data.participants.includes(userId)
    })
    .map(([key, value]: [string, any]) => ({
      id: key,
      ...value,
    }))

  return rooms.sort((a, b) => (b.lastMessageTime || 0) - (a.lastMessageTime || 0))
}

/**
 * Delete a message (for message sender or salon owner)
 */
export async function deleteRealtimeMessage(chatRoomId: string, messageId: string): Promise<void> {
  const db = getRealtimeDb()
  if (!db) {
    throw new Error('Realtime Database not configured')
  }

  await remove(ref(db, `chatRooms/${chatRoomId}/messages/${messageId}`))
}

/**
 * Get unread message count for a user
 */
export async function getUnreadMessageCount(chatRoomId: string, userId: string): Promise<number> {
  const db = getRealtimeDb()
  if (!db) {
    throw new Error('Realtime Database not configured')
  }

  const messagesRef = ref(db, `chatRooms/${chatRoomId}/messages`)
  const snapshot = await get(messagesRef)

  if (!snapshot.exists()) {
    return 0
  }

  const messages = snapshot.val()
  let unreadCount = 0

  Object.values(messages).forEach((msg: any) => {
    if (msg.senderId !== userId && (!msg.readBy || !msg.readBy[userId])) {
      unreadCount++
    }
  })

  return unreadCount
}
