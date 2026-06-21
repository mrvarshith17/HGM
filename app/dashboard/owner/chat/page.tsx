'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSalonChatRooms, getChatRoom } from '@/lib/db-chat-service'
import { ChatWidget } from '@/components/chat-widget'
import { useAuth } from '@/hooks/useAuth'
import type { ChatRoom } from '@/lib/db-chat-service'
import { MessageCircle } from 'lucide-react'

// Prevent static generation for dynamic user content
export const dynamic = 'force-dynamic'

interface Salon {
  id: string
  name: string
}

export default function SalonChatPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([])
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [salons, setSalons] = useState<Salon[]>([])

  // Fetch owner's salons
  useEffect(() => {
    const fetchSalons = async () => {
      if (!user) return

      try {
        setLoading(true)
        console.log('[Chat Page] Fetching salons for ownerId:', user.uid)
        const response = await fetch(`/api/salons?ownerId=${encodeURIComponent(user.uid)}`)
        
        if (!response.ok) {
          console.error('[Chat Page] Failed to fetch salons, status:', response.status)
          setError('Failed to load salon data')
          setLoading(false)
          return
        }

        const salonsData = await response.json()
        console.log('[Chat Page] Fetched salons:', salonsData)
        const salonsList: Salon[] = Array.isArray(salonsData) ? salonsData : []
        
        if (salonsList.length === 0) {
          setError('No salon profile found. Create one to access chat.')
          setLoading(false)
          return
        }

        // Validate that salons have proper id field
        const validSalons = salonsList.filter(salon => salon.id && typeof salon.id === 'string' && salon.id.trim() !== '')
        
        if (validSalons.length === 0) {
          console.error('[Chat Page] No valid salons found with proper ID field:', salonsList)
          setError('Salon data is invalid. Please try creating a new salon.')
          setLoading(false)
          return
        }

        setSalons(validSalons)

        console.log('[Chat Page] Owner salons loaded:', validSalons.map(s => ({ id: s.id, name: s.name })))
        setError('')
      } catch (err) {
        console.error('[Chat Page] Failed to fetch salons:', err)
        setError('Failed to load salon data')
        setLoading(false)
      }
    }

    if (authLoading) return
    if (!user) {
      router.push('/auth/login')
      return
    }

    fetchSalons()
  }, [authLoading, user, router])

  // Load chat rooms for all owner's salons
  useEffect(() => {
    const loadChatRooms = async () => {
      if (salons.length === 0) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const allRooms: ChatRoom[] = []
        
        // Fetch chat rooms for each salon
        for (const salon of salons) {
          try {
            // Validate salon.id exists and is a non-empty string
            if (!salon.id || typeof salon.id !== 'string' || salon.id.trim() === '') {
              console.warn('[Chat Page] Salon has invalid or missing id:', salon)
              continue
            }

            console.log('[Chat Page] Loading chat rooms for salon:', salon.id)
            const response = await getSalonChatRooms(salon.id)
            const rooms = Array.isArray(response) ? response : response.data || []
            console.log('[Chat Page] Got', rooms.length, 'chat rooms for salon', salon.id)
            allRooms.push(...rooms)
          } catch (err) {
            console.warn(`[Chat Page] Failed to load chat rooms for salon ${salon.id}:`, err instanceof Error ? err.message : err)
          }
        }
        
        setChatRooms(allRooms)
        setError('')
      } catch (err) {
        console.error('[Chat Page] Failed to load chat rooms:', err)
        setError('Failed to load chat conversations')
      } finally {
        setLoading(false)
      }
    }

    loadChatRooms()

    // Poll for new chat rooms every 5 seconds
    const interval = setInterval(loadChatRooms, 5000)
    return () => clearInterval(interval)
  }, [salons])

  if (!user) {
    return <div className="p-8">Loading...</div>
  }

  if (salons.length === 0 && !loading) {
    return (
      <div className="max-w-6xl mx-auto p-8">
        <div className="text-center py-12">
          <MessageCircle className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-600 mb-4">No salon profile found.</p>
          <p className="text-gray-500">Create a salon to start chatting with customers.</p>
        </div>
      </div>
    )
  }

  if (loading && chatRooms.length === 0) {
    return <div className="p-8">Loading conversations...</div>
  }

  // Get the first salon ID for the chat widget
  const primarySalonId = salons[0]?.id || ''

  return (
    <div className="max-w-6xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Customer Conversations</h1>

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
                  <p className="font-medium text-gray-900">Customer #{room.userId.slice(0, 8)}</p>
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
              userId={primarySalonId}
              senderName="Salon Owner"
              senderType="owner"
            />
          ) : (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <MessageCircle className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">
                {chatRooms.length > 0
                  ? 'Select a conversation to start chatting'
                  : 'No conversations yet. Customers will appear here.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
