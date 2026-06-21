/**
 * LocalStorage-based data persistence layer
 * Replaces Firebase Firestore for local development and production without Firebase
 */

interface StorageData {
  chatRooms: Record<string, any>
  messages: Record<string, any[]>
  users: Record<string, any>
  bookings: Record<string, any>
  salons: Record<string, any>
  staff: Record<string, any>
  hairstylePreviews: Record<string, any>
  reviews: Record<string, any>
}

const STORAGE_KEY = 'HGM_DATA_STORE'

/**
 * Initialize or get existing data store
 */
function getStore(): StorageData {
  if (typeof window === 'undefined') {
    return {
      chatRooms: {},
      messages: {},
      users: {},
      bookings: {},
      salons: {},
      staff: {},
      hairstylePreviews: {},
      reviews: {},
    }
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.warn('[LocalDataStore] Failed to parse stored data:', error)
  }

  return {
    chatRooms: {},
    messages: {},
    users: {},
    bookings: {},
    salons: {},
    staff: {},
    hairstylePreviews: {},
    reviews: {},
  }
}

/**
 * Save data store to localStorage
 */
function saveStore(data: StorageData): void {
  if (typeof window === 'undefined') {
    return
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (error) {
    console.error('[LocalDataStore] Failed to save data:', error)
  }
}

/**
 * Chat Rooms Operations
 */
export const chatRoomsStore = {
  create(id: string, data: any): any {
    const store = getStore()
    store.chatRooms[id] = {
      id,
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    saveStore(store)
    return store.chatRooms[id]
  },

  get(id: string): any {
    const store = getStore()
    return store.chatRooms[id] || null
  },

  getAll(): any[] {
    const store = getStore()
    return Object.values(store.chatRooms)
  },

  getByUserId(userId: string): any[] {
    const store = getStore()
    return Object.values(store.chatRooms).filter(
      (room: any) => room.userId === userId || room.participants?.includes(userId)
    )
  },

  getBySalonId(salonId: string): any[] {
    const store = getStore()
    return Object.values(store.chatRooms).filter((room: any) => room.salonId === salonId)
  },

  update(id: string, data: any): any {
    const store = getStore()
    if (store.chatRooms[id]) {
      store.chatRooms[id] = {
        ...store.chatRooms[id],
        ...data,
        updatedAt: new Date().toISOString(),
      }
      saveStore(store)
    }
    return store.chatRooms[id] || null
  },

  delete(id: string): void {
    const store = getStore()
    delete store.chatRooms[id]
    saveStore(store)
  },
}

/**
 * Messages Operations
 */
export const messagesStore = {
  create(chatRoomId: string, data: any): any {
    const store = getStore()
    const messageId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const message = {
      id: messageId,
      messageId,
      ...data,
      chatRoomId,
      timestamp: new Date().toISOString(),
    }

    if (!store.messages[chatRoomId]) {
      store.messages[chatRoomId] = []
    }
    store.messages[chatRoomId].push(message)
    saveStore(store)

    // Update chat room's last message
    chatRoomsStore.update(chatRoomId, {
      lastMessage: data.message,
      lastMessageTime: new Date().toISOString(),
    })

    return message
  },

  getByChatRoomId(chatRoomId: string): any[] {
    const store = getStore()
    return store.messages[chatRoomId] || []
  },

  update(chatRoomId: string, messageId: string, data: any): any {
    const store = getStore()
    if (!store.messages[chatRoomId]) {
      return null
    }

    const index = store.messages[chatRoomId].findIndex((m: any) => m.id === messageId)
    if (index !== -1) {
      store.messages[chatRoomId][index] = {
        ...store.messages[chatRoomId][index],
        ...data,
      }
      saveStore(store)
      return store.messages[chatRoomId][index]
    }
    return null
  },

  delete(chatRoomId: string, messageId: string): void {
    const store = getStore()
    if (store.messages[chatRoomId]) {
      store.messages[chatRoomId] = store.messages[chatRoomId].filter(
        (m: any) => m.id !== messageId
      )
      saveStore(store)
    }
  },

  getUnreadCount(chatRoomId: string, userId: string): number {
    const messages = this.getByChatRoomId(chatRoomId)
    return messages.filter(
      (m: any) => m.senderId !== userId && (!m.readBy || !m.readBy[userId])
    ).length
  },
}

/**
 * Users Operations
 */
export const usersStore = {
  create(id: string, data: any): any {
    const store = getStore()
    store.users[id] = {
      id,
      ...data,
      createdAt: new Date().toISOString(),
    }
    saveStore(store)
    return store.users[id]
  },

  get(id: string): any {
    const store = getStore()
    return store.users[id] || null
  },

  getByEmail(email: string): any {
    const store = getStore()
    return Object.values(store.users).find((u: any) => u.email === email) || null
  },

  getAll(): any[] {
    const store = getStore()
    return Object.values(store.users)
  },

  update(id: string, data: any): any {
    const store = getStore()
    if (store.users[id]) {
      store.users[id] = {
        ...store.users[id],
        ...data,
      }
      saveStore(store)
    }
    return store.users[id] || null
  },

  delete(id: string): void {
    const store = getStore()
    delete store.users[id]
    saveStore(store)
  },
}

/**
 * Bookings Operations
 */
export const bookingsStore = {
  create(id: string, data: any): any {
    const store = getStore()
    store.bookings[id] = {
      id,
      ...data,
      createdAt: new Date().toISOString(),
    }
    saveStore(store)
    return store.bookings[id]
  },

  get(id: string): any {
    const store = getStore()
    return store.bookings[id] || null
  },

  getByUserId(userId: string): any[] {
    const store = getStore()
    return Object.values(store.bookings).filter((b: any) => b.userId === userId)
  },

  getBySalonId(salonId: string): any[] {
    const store = getStore()
    return Object.values(store.bookings).filter((b: any) => b.salonId === salonId)
  },

  getAll(): any[] {
    const store = getStore()
    return Object.values(store.bookings)
  },

  update(id: string, data: any): any {
    const store = getStore()
    if (store.bookings[id]) {
      store.bookings[id] = {
        ...store.bookings[id],
        ...data,
      }
      saveStore(store)
    }
    return store.bookings[id] || null
  },

  delete(id: string): void {
    const store = getStore()
    delete store.bookings[id]
    saveStore(store)
  },
}

/**
 * Salons Operations
 */
export const salonsStore = {
  create(id: string, data: any): any {
    const store = getStore()
    store.salons[id] = {
      id,
      ...data,
      createdAt: new Date().toISOString(),
    }
    saveStore(store)
    return store.salons[id]
  },

  get(id: string): any {
    const store = getStore()
    return store.salons[id] || null
  },

  getAll(): any[] {
    const store = getStore()
    return Object.values(store.salons)
  },

  update(id: string, data: any): any {
    const store = getStore()
    if (store.salons[id]) {
      store.salons[id] = {
        ...store.salons[id],
        ...data,
      }
      saveStore(store)
    }
    return store.salons[id] || null
  },

  delete(id: string): void {
    const store = getStore()
    delete store.salons[id]
    saveStore(store)
  },
}

/**
 * Staff Operations
 */
export const staffStore = {
  create(id: string, data: any): any {
    const store = getStore()
    store.staff[id] = {
      id,
      ...data,
      createdAt: new Date().toISOString(),
    }
    saveStore(store)
    return store.staff[id]
  },

  get(id: string): any {
    const store = getStore()
    return store.staff[id] || null
  },

  getBySalonId(salonId: string): any[] {
    const store = getStore()
    return Object.values(store.staff).filter((s: any) => s.salonId === salonId)
  },

  getAll(): any[] {
    const store = getStore()
    return Object.values(store.staff)
  },

  update(id: string, data: any): any {
    const store = getStore()
    if (store.staff[id]) {
      store.staff[id] = {
        ...store.staff[id],
        ...data,
      }
      saveStore(store)
    }
    return store.staff[id] || null
  },

  delete(id: string): void {
    const store = getStore()
    delete store.staff[id]
    saveStore(store)
  },
}

/**
 * Hairstyle Previews Operations
 */
export const hairstylePreviewsStore = {
  create(id: string, data: any): any {
    const store = getStore()
    store.hairstylePreviews[id] = {
      id,
      ...data,
      createdAt: new Date().toISOString(),
    }
    saveStore(store)
    return store.hairstylePreviews[id]
  },

  get(id: string): any {
    const store = getStore()
    return store.hairstylePreviews[id] || null
  },

  getByUserId(userId: string): any[] {
    const store = getStore()
    return Object.values(store.hairstylePreviews).filter((p: any) => p.userId === userId)
  },

  getAll(): any[] {
    const store = getStore()
    return Object.values(store.hairstylePreviews)
  },

  update(id: string, data: any): any {
    const store = getStore()
    if (store.hairstylePreviews[id]) {
      store.hairstylePreviews[id] = {
        ...store.hairstylePreviews[id],
        ...data,
      }
      saveStore(store)
    }
    return store.hairstylePreviews[id] || null
  },

  delete(id: string): void {
    const store = getStore()
    delete store.hairstylePreviews[id]
    saveStore(store)
  },
}

/**
 * Reviews Operations
 */
export const reviewsStore = {
  create(id: string, data: any): any {
    const store = getStore()
    store.reviews[id] = {
      id,
      ...data,
      createdAt: new Date().toISOString(),
    }
    saveStore(store)
    return store.reviews[id]
  },

  get(id: string): any {
    const store = getStore()
    return store.reviews[id] || null
  },

  getBySalonId(salonId: string): any[] {
    const store = getStore()
    return Object.values(store.reviews).filter((r: any) => r.salonId === salonId)
  },

  getAll(): any[] {
    const store = getStore()
    return Object.values(store.reviews)
  },

  update(id: string, data: any): any {
    const store = getStore()
    if (store.reviews[id]) {
      store.reviews[id] = {
        ...store.reviews[id],
        ...data,
      }
      saveStore(store)
    }
    return store.reviews[id] || null
  },

  delete(id: string): void {
    const store = getStore()
    delete store.reviews[id]
    saveStore(store)
  },
}

/**
 * Clear all data
 */
export function clearAllData(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY)
  }
}

/**
 * Export all data for debugging
 */
export function exportAllData(): StorageData {
  return getStore()
}
