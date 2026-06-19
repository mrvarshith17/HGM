'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface DebugData {
  stats?: {
    totalRooms: number
    totalMessages: number
    users: number
    salons: number
  }
  rooms?: any[]
  messages?: Record<string, any[]>
  timestamp?: string
  debugInfo?: string
}

export default function DebugChatPage() {
  const router = useRouter()
  const [userId, setUserId] = useState('')
  const [salonId, setSalonId] = useState('')
  const [userDebugData, setUserDebugData] = useState<DebugData | null>(null)
  const [salonDebugData, setSalonDebugData] = useState<DebugData | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchDebugData = async () => {
    try {
      setLoading(true)
      
      if (userId) {
        const response = await fetch(`/api/chat/debug/rooms?userId=${encodeURIComponent(userId)}`)
        const data = await response.json()
        setUserDebugData(data)
      }
      
      if (salonId) {
        const response = await fetch(`/api/chat/debug/rooms?salonId=${encodeURIComponent(salonId)}`)
        const data = await response.json()
        setSalonDebugData(data)
      }
    } catch (error) {
      console.error('Failed to fetch debug data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId') || localStorage.getItem('authToken')
    const storedSalonId = localStorage.getItem('salonId')
    
    if (storedUserId) setUserId(storedUserId)
    if (storedSalonId) setSalonId(storedSalonId)
  }, [])

  return (
    <div className="max-w-7xl mx-auto p-8">
      <h1 className="text-4xl font-bold mb-8">Chat Debug Dashboard</h1>
      
      <div className="grid grid-cols-2 gap-8 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Your IDs</h2>
          <div className="space-y-2 text-sm font-mono">
            <p><span className="text-gray-500">User ID:</span> {userId || 'Not set'}</p>
            <p><span className="text-gray-500">Salon ID:</span> {salonId || 'Not set'}</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <button
            onClick={fetchDebugData}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
          >
            {loading ? 'Loading...' : 'Refresh Debug Data'}
          </button>
        </div>
      </div>

      {/* User Debug Data */}
      {userDebugData && (
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-2xl font-semibold mb-4">Your Chat Rooms</h2>
          <p className="text-sm text-gray-500 mb-4">{userDebugData.debugInfo}</p>
          
          <div className="mb-4">
            <h3 className="font-semibold mb-2">Rooms ({userDebugData.rooms?.length || 0})</h3>
            {userDebugData.rooms && userDebugData.rooms.length > 0 ? (
              <div className="space-y-2">
                {userDebugData.rooms.map((room: any) => (
                  <div key={room.chatRoomId} className="bg-gray-50 p-3 rounded text-sm font-mono">
                    <div className="font-semibold text-blue-600">{room.chatRoomId.substring(0, 8)}...</div>
                    <div className="text-xs text-gray-600 mt-1">
                      <p>Booking: {room.bookingId}</p>
                      <p>Salon: {room.salonId.substring(0, 8)}...</p>
                      <p>Messages: <span className="font-bold text-green-600">{room.messageCount}</span></p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No chat rooms</p>
            )}
          </div>
        </div>
      )}

      {/* Salon Debug Data */}
      {salonDebugData && (
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-2xl font-semibold mb-4">Your Salon Chat Rooms</h2>
          <p className="text-sm text-gray-500 mb-4">{salonDebugData.debugInfo}</p>
          
          <div className="mb-4">
            <h3 className="font-semibold mb-2">Rooms ({salonDebugData.rooms?.length || 0})</h3>
            {salonDebugData.rooms && salonDebugData.rooms.length > 0 ? (
              <div className="space-y-2">
                {salonDebugData.rooms.map((room: any) => (
                  <div key={room.chatRoomId} className="bg-gray-50 p-3 rounded text-sm font-mono">
                    <div className="font-semibold text-blue-600">{room.chatRoomId.substring(0, 8)}...</div>
                    <div className="text-xs text-gray-600 mt-1">
                      <p>Booking: {room.bookingId}</p>
                      <p>Customer: {room.userId.substring(0, 8)}...</p>
                      <p>Messages: <span className="font-bold text-green-600">{room.messageCount}</span></p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No chat rooms for this salon</p>
            )}
          </div>
        </div>
      )}

      {/* Overall Stats */}
      {(userDebugData || salonDebugData) && (userDebugData?.stats || salonDebugData?.stats) && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-semibold mb-4">Overall Memory Stats</h2>
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded">
              <p className="text-gray-600">Total Rooms</p>
              <p className="text-2xl font-bold text-blue-600">
                {userDebugData?.stats?.totalRooms || salonDebugData?.stats?.totalRooms || 0}
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded">
              <p className="text-gray-600">Total Messages</p>
              <p className="text-2xl font-bold text-green-600">
                {userDebugData?.stats?.totalMessages || salonDebugData?.stats?.totalMessages || 0}
              </p>
            </div>
            <div className="bg-purple-50 p-4 rounded">
              <p className="text-gray-600">Active Users</p>
              <p className="text-2xl font-bold text-purple-600">
                {userDebugData?.stats?.users || salonDebugData?.stats?.users || 0}
              </p>
            </div>
            <div className="bg-orange-50 p-4 rounded">
              <p className="text-gray-600">Active Salons</p>
              <p className="text-2xl font-bold text-orange-600">
                {userDebugData?.stats?.salons || salonDebugData?.stats?.salons || 0}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
