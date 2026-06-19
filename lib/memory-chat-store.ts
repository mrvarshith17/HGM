/**
 * In-memory chat storage (temporary solution while Firestore auth is being fixed)
 * This stores chat rooms and messages in memory
 * NOTE: Data will be lost on server restart
 */

interface StoredChatRoom {
  chatRoomId: string
  bookingId: string
  userId: string
  salonId: string
  staffId?: string | null
  participants: string[]
  createdAt: string
  updatedAt: string
  lastMessage?: string | null
  lastMessageTime?: string | null
}

interface StoredMessage {
  messageId: string
  chatRoomId: string
  senderId: string
  senderType: 'user' | 'owner' | 'staff'
  senderName: string
  message: string
  timestamp: string
  read: boolean
}

// Global storage
const chatRooms = new Map<string, StoredChatRoom>()
const messages = new Map<string, StoredMessage[]>()
const userToRooms = new Map<string, string[]>()
const salonToRooms = new Map<string, string[]>()

export function createRoom(room: StoredChatRoom): void {
  chatRooms.set(room.chatRoomId, room)
  
  // Track by user
  if (!userToRooms.has(room.userId)) {
    userToRooms.set(room.userId, [])
  }
  userToRooms.get(room.userId)!.push(room.chatRoomId)
  
  // Track by salon
  if (!salonToRooms.has(room.salonId)) {
    salonToRooms.set(room.salonId, [])
  }
  salonToRooms.get(room.salonId)!.push(room.chatRoomId)
  
  // Initialize messages array
  messages.set(room.chatRoomId, [])
}

export function getRoom(chatRoomId: string): StoredChatRoom | undefined {
  return chatRooms.get(chatRoomId)
}

export function getRoomByBooking(bookingId: string): StoredChatRoom | undefined {
  for (const room of chatRooms.values()) {
    if (room.bookingId === bookingId) {
      return room
    }
  }
  return undefined
}

export function getUserRooms(userId: string): StoredChatRoom[] {
  const roomIds = userToRooms.get(userId) || []
  return roomIds
    .map(id => chatRooms.get(id))
    .filter((room): room is StoredChatRoom => room !== undefined)
}

export function getSalonRooms(salonId: string): StoredChatRoom[] {
  const roomIds = salonToRooms.get(salonId) || []
  return roomIds
    .map(id => chatRooms.get(id))
    .filter((room): room is StoredChatRoom => room !== undefined)
}

export function addMessage(msg: StoredMessage): void {
  if (!messages.has(msg.chatRoomId)) {
    messages.set(msg.chatRoomId, [])
  }
  messages.get(msg.chatRoomId)!.push(msg)
  
  // Update last message in room
  const room = chatRooms.get(msg.chatRoomId)
  if (room) {
    room.lastMessage = msg.message
    room.lastMessageTime = msg.timestamp
  }
}

export function getRoomMessages(chatRoomId: string): StoredMessage[] {
  return messages.get(chatRoomId) || []
}

export function getAllStats(): object {
  return {
    totalRooms: chatRooms.size,
    totalMessages: Array.from(messages.values()).reduce((sum, msgs) => sum + msgs.length, 0),
    users: userToRooms.size,
    salons: salonToRooms.size,
  }
}
