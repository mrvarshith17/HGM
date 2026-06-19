'use client'

import { useEffect, useState } from 'react'

interface DebugInfo {
  mode: string
  rooms?: any[]
  roomCount?: number
  totalStats?: any
  totalRooms?: number
  totalMessages?: number
  activeUsers?: number
  activeSalons?: number
}

export default function ChatSyncDebugPage() {
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null)
  const [salonId, setSalonId] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchDebugInfo = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/chat/debug/sync')
        const data = await response.json()
        setDebugInfo(data)
        setError('')
      } catch (err) {
        console.error('Failed to fetch debug info:', err)
        setError('Failed to fetch debug information')
      } finally {
        setLoading(false)
      }
    }

    fetchDebugInfo()
  }, [])

  const handleCheckSalon = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!salonId.trim()) return

    try {
      setLoading(true)
      const response = await fetch(`/api/chat/debug/sync?salonId=${encodeURIComponent(salonId)}`)
      const data = await response.json()
      setDebugInfo(data)
      setError('')
    } catch (err) {
      console.error('Failed to fetch salon debug info:', err)
      setError('Failed to fetch salon information')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="p-8">Loading debug information...</div>
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Chat Sync Diagnostic</h1>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Overall Stats */}
      {debugInfo?.mode === 'all-stats' && (
        <div className="mb-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
          <h2 className="text-xl font-bold mb-4">Overall Chat System Status</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-600">Total Rooms:</p>
              <p className="text-2xl font-bold text-blue-600">
                {debugInfo.totalRooms || 0}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Total Messages:</p>
              <p className="text-2xl font-bold text-blue-600">
                {debugInfo.totalMessages || 0}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Active Users:</p>
              <p className="text-2xl font-bold text-green-600">
                {debugInfo.activeUsers || 0}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Active Salons:</p>
              <p className="text-2xl font-bold text-green-600">
                {debugInfo.activeSalons || 0}
              </p>
            </div>
          </div>

          {(debugInfo.totalRooms || 0) === 0 && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-yellow-800">
              ⚠️ No chat rooms found in the system. Check if bookings are being created.
            </div>
          )}
        </div>
      )}

      {/* Salon-Specific Check */}
      <form onSubmit={handleCheckSalon} className="mb-8 p-6 bg-gray-50 border border-gray-200 rounded-lg">
        <h2 className="text-xl font-bold mb-4">Check Specific Salon</h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={salonId}
            onChange={(e) => setSalonId(e.target.value)}
            placeholder="Enter salon ID"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
          />
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Check
          </button>
        </div>
      </form>

      {debugInfo?.mode === 'salon-specific' && (
        <div className="p-6 bg-green-50 border border-green-200 rounded-lg">
          <h2 className="text-xl font-bold mb-4">Salon: {debugInfo.salonId}</h2>
          <div className="mb-4">
            <p className="text-gray-600">Chat Rooms for this Salon:</p>
            <p className="text-2xl font-bold text-green-600">{debugInfo.roomCount || 0}</p>
          </div>

          {debugInfo.roomCount && debugInfo.roomCount > 0 ? (
            <div>
              <h3 className="font-semibold mb-2">Rooms:</h3>
              <div className="space-y-2">
                {debugInfo.rooms?.map((room: any, idx: number) => (
                  <div key={idx} className="p-3 bg-white border border-green-200 rounded">
                    <p className="font-mono text-sm">ID: {room.chatRoomId}</p>
                    <p className="text-sm text-gray-600">
                      User: {room.userId} | Booking: {room.bookingId}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-yellow-800">
              ⚠️ No chat rooms found for this salon. Customer messages may have been created with a different salon ID.
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      <div className="mt-8 p-6 bg-purple-50 border border-purple-200 rounded-lg">
        <h2 className="text-lg font-bold mb-4">How to Fix Message Sync Issues</h2>
        <ol className="list-decimal list-inside space-y-2 text-gray-700">
          <li>Check the overall stats above - ensure there are rooms in the system</li>
          <li>Get your salon ID from the chat page and paste it above</li>
          <li>Click "Check" to see how many rooms are assigned to your salon</li>
          <li>If no rooms appear, check that the booking was created with the correct salon ID</li>
          <li>Send a new message and check the room count again - it should increase</li>
        </ol>
      </div>
    </div>
  )
}
