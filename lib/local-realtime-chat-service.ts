/**
 * Local Storage-based Chat Service (when Firebase is not available)
 * Provides the same interface as Firebase Realtime Database but uses localStorage
 */

import { chatRoomsStore, messagesStore } from './local-data-store'

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

// Store listeners for real-time updates
const messageListeners: Map<string, Set<(messages: RealtimeMessage[]) => void>> = new Map()
const roomListeners: Map<string, Set<(room: RealtimeChatRoom | null) => void>> = new Map()

/**
 * Send a message to a chat room
 */
export async function sendRealtimeMessage(
  chatRoomId: string,
  senderId: string,
  senderName: string,
  senderType: 'user' | 'owner' | 'staff',
  message: string
): Promise<RealtimeMessage> {
  const messageData = messagesStore.create(chatRoomId, {
    senderId,
    senderName,
    senderType,
    message,
    read: false,
    readBy: { [senderId]: true },
  })

  // Notify listeners
  notifyMessageListeners(chatRoomId)

  return {
    id: messageData.id,
    chatRoomId,
    senderId,
    senderName,
    senderType,
    message,
    timestamp: new Date(messageData.timestamp).getTime(),
    read: false,
    readBy: { [senderId]: true },
  }
}

/**
 * Create a new chat room
 */
export async function createRealtimeChatRoom(
  roomData: Omit<RealtimeChatRoom, 'id' | 'createdAt' | 'updatedAt'>
): Promise<RealtimeChatRoom> {
  const now = Date.now()
  const roomId = `room-${now}-${Math.random().toString(36).substr(2, 9)}`

  const room = chatRoomsStore.create(roomId, {
    bookingId: roomData.bookingId,
    userId: roomData.userId,
    salonId: roomData.salonId,
    staffId: roomData.staffId,
    participants: roomData.participants,
  })

  return {
    id: roomId,
    bookingId: room.bookingId,
    userId: room.userId,
    salonId: room.salonId,
    staffId: room.staffId,
    participants: room.participants,
    createdAt: new Date(room.createdAt).getTime(),
    updatedAt: new Date(room.updatedAt).getTime(),
  }
}

/**
 * Listen to messages in real-time
 */
export function subscribeToMessages(
  chatRoomId: string,
  onMessagesChange: (messages: RealtimeMessage[]) => void,
  onError?: (error: Error) => void
): () => void {
  if (!messageListeners.has(chatRoomId)) {
    messageListeners.set(chatRoomId, new Set())
  }

  messageListeners.get(chatRoomId)!.add(onMessagesChange)

  // Send initial messages
  const messages = getRealtimeMessages(chatRoomId)
  messages.then(onMessagesChange).catch((error) => {
    onError?.(error)
  })

  // Return unsubscribe function
  return () => {
    messageListeners.get(chatRoomId)?.delete(onMessagesChange)
  }
}

/**
 * Listen to chat room updates in real-time
 */
export function subscribeToChatRoom(
  chatRoomId: string,
  onRoomChange: (room: RealtimeChatRoom | null) => void,
  onError?: (error: Error) => void
): () => void {
  if (!roomListeners.has(chatRoomId)) {
    roomListeners.set(chatRoomId, new Set())
  }

  roomListeners.get(chatRoomId)!.add(onRoomChange)

  // Send initial room data
  const room = getRealtimeChatRoom(chatRoomId)
  room.then(onRoomChange).catch((error) => {
    onError?.(error)
  })

  // Return unsubscribe function
  return () => {
    roomListeners.get(chatRoomId)?.delete(onRoomChange)
  }
}

/**
 * Get messages for a chat room (one-time fetch)
 */
export async function getRealtimeMessages(chatRoomId: string): Promise<RealtimeMessage[]> {
  const messages = messagesStore.getByChatRoomId(chatRoomId)

  return messages.map((msg: any) => ({
    id: msg.id,
    chatRoomId,
    senderId: msg.senderId,
    senderName: msg.senderName,
    senderType: msg.senderType,
    message: msg.message,
    timestamp: new Date(msg.timestamp).getTime(),
    read: msg.read,
    readBy: msg.readBy,
  }))
}

/**
 * Get chat room details (one-time fetch)
 */
export async function getRealtimeChatRoom(chatRoomId: string): Promise<RealtimeChatRoom | null> {
  const room = chatRoomsStore.get(chatRoomId)

  if (!room) {
    return null
  }

  return {
    id: room.id,
    bookingId: room.bookingId,
    userId: room.userId,
    salonId: room.salonId,
    staffId: room.staffId,
    participants: room.participants,
    createdAt: new Date(room.createdAt).getTime(),
    updatedAt: new Date(room.updatedAt).getTime(),
    lastMessage: room.lastMessage,
    lastMessageTime: room.lastMessageTime ? new Date(room.lastMessageTime).getTime() : undefined,
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
  const messages = messagesStore.getByChatRoomId(chatRoomId)

  if (messageIds && messageIds.length > 0) {
    messageIds.forEach((messageId) => {
      const message = messages.find((m: any) => m.id === messageId)
      if (message) {
        messagesStore.update(chatRoomId, messageId, {
          readBy: {
            ...message.readBy,
            [userId]: true,
          },
        })
      }
    })
  } else {
    messages.forEach((message: any) => {
      messagesStore.update(chatRoomId, message.id, {
        readBy: {
          ...message.readBy,
          [userId]: true,
        },
      })
    })
  }

  notifyMessageListeners(chatRoomId)
}

/**
 * Get user's chat rooms
 */
export async function getUserChatRooms(userId: string): Promise<RealtimeChatRoom[]> {
  const rooms = chatRoomsStore.getByUserId(userId)

  return rooms.map((room: any) => ({
    id: room.id,
    bookingId: room.bookingId,
    userId: room.userId,
    salonId: room.salonId,
    staffId: room.staffId,
    participants: room.participants,
    createdAt: new Date(room.createdAt).getTime(),
    updatedAt: new Date(room.updatedAt).getTime(),
    lastMessage: room.lastMessage,
    lastMessageTime: room.lastMessageTime ? new Date(room.lastMessageTime).getTime() : undefined,
  }))
}

/**
 * Delete a message
 */
export async function deleteRealtimeMessage(chatRoomId: string, messageId: string): Promise<void> {
  messagesStore.delete(chatRoomId, messageId)
  notifyMessageListeners(chatRoomId)
}

/**
 * Get unread message count
 */
export async function getUnreadMessageCount(chatRoomId: string, userId: string): Promise<number> {
  return messagesStore.getUnreadCount(chatRoomId, userId)
}

/**
 * Notify all listeners of message changes
 */
function notifyMessageListeners(chatRoomId: string): void {
  const listeners = messageListeners.get(chatRoomId)
  if (listeners) {
    getRealtimeMessages(chatRoomId).then((messages) => {
      listeners.forEach((listener) => {
        listener(messages)
      })
    })
  }
}

/**
 * Notify all listeners of room changes
 */
function notifyRoomListeners(chatRoomId: string): void {
  const listeners = roomListeners.get(chatRoomId)
  if (listeners) {
    getRealtimeChatRoom(chatRoomId).then((room) => {
      listeners.forEach((listener) => {
        listener(room)
      })
    })
  }
}
