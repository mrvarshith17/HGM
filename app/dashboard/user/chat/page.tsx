'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getUserChatRooms } from '@/lib/db-chat-service'
import { getSalon } from '@/lib/db-salon-service'
import { ChatWidget } from '@/components/chat-widget'
import { useAuth } from '@/hooks/useAuth'
import type { ChatRoom } from '@/lib/db-chat-service'
import type { Salon } from '@/lib/db-salon-service'
import { MessageCircle } from 'lucide-react'

export default function UserChatPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [chatRooms, setChatRooms] = useState<(ChatRoom & { salonName?: string })[]>([])
  const [selectedRoom, setSelectedRoom] = useState<(ChatRoom & { salonName?: string }) | null>(
    null
  )
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (authLoading) return
    
    if (!user) {
      router.push('/auth/login')
      return
    }
  }, [authLoading, user, router])

  // Load chat rooms for user
  useEffect(() => {
    const loadChatRooms = async () => {
      if (!user) return

      try {
        setLoading(true)
        const response = await getUserChatRooms(user.uid)
        const roomsWithNames = await Promise.all(
          (Array.isArray(response) ? response : response.data || []).map(async (room: ChatRoom) => {
            try {
              const salonData = await getSalon(room.salonId)
              return {
                ...room,
                salonName: salonData.name,
              }
            } catch {
              return {
                ...room,
                salonName: 'Unknown Salon',
              }
            }
          })
        )
        setChatRooms(roomsWithNames)
        setError('')
      } catch (err) {
        console.error('Failed to load chat rooms:', err)
        setError('Failed to load chat conversations')
      } finally {
        setLoading(false)
      }
    }

    loadChatRooms()

    // Poll for new chat rooms every 5 seconds
    const interval = setInterval(loadChatRooms, 5000)
    return () => clearInterval(interval)
  }, [user])

  if (!user) {
    return <div className="p-8">Loading...</div>
  }

  if (loading && chatRooms.length === 0) {
    return <div className="p-8">Loading conversations...</div>
  }

  return (
    <div className="max-w-6xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Messages</h1>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chat Rooms List */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Conversations
          </h2>

          {chatRooms.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No active conversations yet</p>
              <p className="text-sm mt-2">Chat will appear after you book an appointment</p>
            </div>
          ) : (
            <div className="space-y-2">
              {chatRooms.map((room) => (
                <button
                  key={room.chatRoomId}
                  onClick={() => setSelectedRoom(room)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition ${
                    selectedRoom?.chatRoomId === room.chatRoomId
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <p className="font-medium text-gray-900">{room.salonName}</p>
                  {room.lastMessage && (
                    <p className="text-sm text-gray-600 truncate mt-1">
                      {room.lastMessage}
                    </p>
                  )}
                  {room.lastMessageTime && (
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(room.lastMessageTime).toLocaleString()}
                    </p>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Chat View */}
        <div className="lg:col-span-2">
          {selectedRoom ? (
            <ChatWidget
              chatRoomId={selectedRoom.chatRoomId}
              userId={user.uid}
              senderName="Customer"
              senderType="user"
            />
          ) : (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <MessageCircle className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">
                {chatRooms.length > 0
                  ? 'Select a conversation to start chatting'
                  : 'No conversations yet. Book an appointment to chat with salon owners.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
