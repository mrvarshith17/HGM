# Real-Time Chat Integration Examples

Practical examples for integrating live chat into your application.

## Example 1: Appointment Detail Page with Chat

```tsx
'use client'

import { useState, useEffect } from 'react'
import { ChatWidgetRealtime } from '@/components/chat-widget-realtime'
import { createRealtimeChatRoom } from '@/lib/realtime-chat-service'
import { MessageSquare } from 'lucide-react'

interface Appointment {
  id: string
  bookingId: string
  salonId: string
  salonName: string
  date: string
  time: string
  service: string
  price: number
  staffMember: string
}

export default function AppointmentDetail({
  params,
}: {
  params: { bookingId: string }
}) {
  const appointment: Appointment = {
    id: 'apt-123',
    bookingId: params.bookingId,
    salonId: 'salon-456',
    salonName: 'Premium Hair Studio',
    date: '2024-01-20',
    time: '10:00 AM',
    service: 'Hair Cut & Styling',
    price: 45,
    staffMember: 'Sarah Johnson',
  }

  const userId = 'user-789' // From auth
  const [chatRoomId, setChatRoomId] = useState<string | null>(null)
  const [showChat, setShowChat] = useState(false)
  const [loading, setLoading] = useState(false)

  // Initialize chat room when component loads
  useEffect(() => {
    const initChat = async () => {
      try {
        setLoading(true)
        const room = await createRealtimeChatRoom({
          bookingId: appointment.bookingId,
          userId,
          salonId: appointment.salonId,
          participants: [userId, appointment.salonId],
        })
        setChatRoomId(room.id)
      } catch (error) {
        console.error('Failed to initialize chat:', error)
      } finally {
        setLoading(false)
      }
    }

    initChat()
  }, [appointment.bookingId, appointment.salonId, userId])

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 p-8">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Appointment Details */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-6 text-gray-900">
            Your Appointment
          </h1>

          <div className="space-y-6">
            {/* Salon Info */}
            <div className="border-b pb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                {appointment.salonName}
              </h2>
              <p className="text-gray-600">📍 123 Main Street, Downtown</p>
              <p className="text-gray-600">📞 (555) 123-4567</p>
            </div>

            {/* Appointment Details */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-500 mb-1">Date</p>
                <p className="text-xl font-semibold text-gray-900">
                  {appointment.date}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Time</p>
                <p className="text-xl font-semibold text-gray-900">
                  {appointment.time}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Service</p>
                <p className="text-xl font-semibold text-gray-900">
                  {appointment.service}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Staff</p>
                <p className="text-xl font-semibold text-gray-900">
                  {appointment.staffMember}
                </p>
              </div>
            </div>

            {/* Price */}
            <div className="bg-indigo-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Total Price</p>
              <p className="text-3xl font-bold text-indigo-600">
                ${appointment.price}
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-6">
              <button className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium">
                Reschedule
              </button>
              <button className="flex-1 px-6 py-3 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition font-medium">
                Cancel Appointment
              </button>
            </div>
          </div>
        </div>

        {/* Chat Sidebar */}
        <div className="lg:col-span-1">
          {chatRoomId ? (
            showChat ? (
              <div className="bg-white rounded-lg shadow-lg overflow-hidden sticky top-8">
                <ChatWidgetRealtime
                  chatRoomId={chatRoomId}
                  userId={userId}
                  senderName="John Doe"
                  senderType="user"
                  onClose={() => setShowChat(false)}
                />
              </div>
            ) : (
              <button
                onClick={() => setShowChat(true)}
                className="w-full bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition text-center"
              >
                <MessageSquare className="w-12 h-12 text-indigo-600 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">
                  Chat with Salon
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Have questions before your appointment?
                </p>
                <span className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium">
                  Open Chat
                </span>
              </button>
            )
          ) : (
            <div className="bg-white rounded-lg shadow-lg p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-3"></div>
              <p className="text-gray-600">Initializing chat...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
```

## Example 2: Salon Dashboard with Chat Management

```tsx
'use client'

import { useState, useEffect } from 'react'
import { getUserChatRooms } from '@/lib/realtime-chat-service'
import { ChatWidgetRealtime } from '@/components/chat-widget-realtime'
import { MessageSquare, Clock, Check } from 'lucide-react'

interface ChatRoomPreview {
  id: string
  lastMessage?: string
  lastMessageTime?: number
  participantName: string
  unreadCount: number
}

export default function SalonChatDashboard() {
  const salonId = 'salon-456' // From auth
  const [chatRooms, setChatRooms] = useState<ChatRoomPreview[]>([])
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Load chat rooms
  useEffect(() => {
    const loadChats = async () => {
      try {
        setLoading(true)
        const rooms = await getUserChatRooms(salonId)
        
        // Transform to preview format
        const previews = rooms.map((room) => ({
          id: room.id,
          lastMessage: room.lastMessage,
          lastMessageTime: room.lastMessageTime,
          participantName: 'Customer', // Could fetch from user data
          unreadCount: Math.floor(Math.random() * 3), // Mock unread count
        }))

        setChatRooms(previews)
      } catch (error) {
        console.error('Failed to load chat rooms:', error)
      } finally {
        setLoading(false)
      }
    }

    loadChats()
  }, [salonId])

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gray-900">
          Customer Messages
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Chat List */}
          <div className="lg:col-span-1 bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="p-4 border-b bg-gradient-to-r from-indigo-50 to-blue-50">
              <h2 className="font-semibold text-gray-900">
                Conversations ({chatRooms.length})
              </h2>
            </div>

            <div className="divide-y max-h-96 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-gray-500">Loading...</div>
              ) : chatRooms.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  No active chats
                </div>
              ) : (
                chatRooms.map((room) => (
                  <button
                    key={room.id}
                    onClick={() => setSelectedRoomId(room.id)}
                    className={`w-full p-4 text-left transition ${
                      selectedRoomId === room.id
                        ? 'bg-indigo-50 border-l-4 border-indigo-600'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-900">
                        {room.participantName}
                      </h3>
                      {room.unreadCount > 0 && (
                        <span className="inline-flex items-center justify-center w-5 h-5 bg-red-500 text-white text-xs rounded-full font-bold">
                          {room.unreadCount}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 truncate">
                      {room.lastMessage || 'No messages yet'}
                    </p>
                    {room.lastMessageTime && (
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(room.lastMessageTime).toLocaleString()}
                      </p>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Chat Window */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-lg overflow-hidden">
            {selectedRoomId ? (
              <ChatWidgetRealtime
                chatRoomId={selectedRoomId}
                userId={salonId}
                senderName="Salon Support"
                senderType="owner"
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-96 text-center">
                <MessageSquare className="w-16 h-16 text-gray-300 mb-4" />
                <p className="text-gray-500 mb-2">Select a conversation to start</p>
                <p className="text-sm text-gray-400">
                  Click on any chat to view messages
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
```

## Example 3: Floating Chat Button (Global)

```tsx
'use client'

import { useState } from 'react'
import { ChatWidgetRealtime } from '@/components/chat-widget-realtime'
import { MessageCircle, X } from 'lucide-react'

export function GlobalChatButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [chatRoomId] = useState('default-chat-room')
  const [userId] = useState('user-789')

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition flex items-center justify-center z-40"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-96 bg-white rounded-lg shadow-2xl flex flex-col z-50">
          {/* Close Button */}
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-3 right-3 p-1 text-gray-500 hover:text-gray-700 z-10"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Chat Component */}
          <ChatWidgetRealtime
            chatRoomId={chatRoomId}
            userId={userId}
            senderName="Customer"
            senderType="user"
            onClose={() => setIsOpen(false)}
          />
        </div>
      )}
    </>
  )
}
```

## Example 4: Chat Room Creation Flow

```tsx
'use client'

import { useState } from 'react'
import { createRealtimeChatRoom } from '@/lib/realtime-chat-service'
import { ChatWidgetRealtime } from '@/components/chat-widget-realtime'

export function StartChatFlow() {
  const [chatRoomId, setChatRoomId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleStartChat = async (salonId: string) => {
    try {
      setLoading(true)
      setError('')

      const room = await createRealtimeChatRoom({
        bookingId: `booking-${Date.now()}`,
        userId: 'current-user-id',
        salonId,
        participants: ['current-user-id', salonId],
      })

      setChatRoomId(room.id)
    } catch (err) {
      setError('Failed to start chat. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (chatRoomId) {
    return (
      <ChatWidgetRealtime
        chatRoomId={chatRoomId}
        userId="current-user-id"
        senderName="John Doe"
        senderType="user"
        onClose={() => setChatRoomId(null)}
      />
    )
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Start a Chat</h2>
      {error && <p className="text-red-600 mb-4">{error}</p>}
      <button
        onClick={() => handleStartChat('salon-123')}
        disabled={loading}
        className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400"
      >
        {loading ? 'Starting...' : 'Chat with Salon'}
      </button>
    </div>
  )
}
```

## Example 5: Handling Offline Messages

```tsx
'use client'

import { useEffect, useState } from 'react'
import { ChatWidgetRealtime } from '@/components/chat-widget-realtime'
import { AlertCircle, CheckCircle } from 'lucide-react'

export function ChatWithOfflineSupport() {
  const [offlineMessages, setOfflineMessages] = useState<string[]>([])
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return (
    <div className="space-y-4">
      {!isOnline && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-yellow-600" />
          <p className="text-yellow-800">
            You're offline. Messages will be sent when connection is restored.
          </p>
        </div>
      )}

      {offlineMessages.length > 0 && isOnline && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <p className="text-green-800">
            {offlineMessages.length} queued message(s) sent!
          </p>
        </div>
      )}

      <ChatWidgetRealtime
        chatRoomId="room-123"
        userId="user-456"
        senderName="John"
        senderType="user"
      />
    </div>
  )
}
```

## Integration Checklist

- [ ] Install Firebase SDK: `npm install firebase`
- [ ] Add environment variables to `.env.local`
- [ ] Enable Realtime Database in Firebase Console
- [ ] Set up security rules
- [ ] Import `ChatWidgetRealtime` component
- [ ] Create chat rooms with `createRealtimeChatRoom()`
- [ ] Test real-time message delivery
- [ ] Test offline/reconnection behavior
- [ ] Add unread badge to chat icon
- [ ] Implement chat room list with preview
- [ ] Add notifications for new messages
- [ ] Test on mobile devices

## Troubleshooting

See [REALTIME_CHAT_SETUP.md](./REALTIME_CHAT_SETUP.md#troubleshooting) for common issues and solutions.
