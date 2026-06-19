'use client'

import { useEffect, useRef, useState } from 'react'
import { Send, X, AlertCircle, Wifi, WifiOff } from 'lucide-react'
import {
  subscribeToMessages,
  sendRealtimeMessage,
  markMessagesAsRead,
  isRealtimeDbConfigured,
} from '@/lib/realtime-chat-service'
import type { RealtimeMessage } from '@/lib/realtime-chat-service'

interface ChatWidgetRealtimeProps {
  chatRoomId: string
  userId: string
  senderName: string
  senderType: 'user' | 'owner' | 'staff'
  onClose?: () => void
}

export function ChatWidgetRealtime({
  chatRoomId,
  userId,
  senderName,
  senderType,
  onClose,
}: ChatWidgetRealtimeProps) {
  const [messages, setMessages] = useState<RealtimeMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [isConnected, setIsConnected] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const unsubscribeRef = useRef<(() => void) | null>(null)

  // Check if real-time DB is configured
  useEffect(() => {
    if (!isRealtimeDbConfigured()) {
      setError('Real-time chat is not configured. Please check environment variables.')
      setLoading(false)
    }
  }, [])

  // Scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Subscribe to real-time messages
  useEffect(() => {
    if (!isRealtimeDbConfigured() || !chatRoomId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError('')

      unsubscribeRef.current = subscribeToMessages(
        chatRoomId,
        (newMessages) => {
          setMessages(newMessages)
          setLoading(false)
          setIsConnected(true)
          
          // Mark all messages as read
          const unreadMessageIds = newMessages
            .filter((msg) => msg.senderId !== userId && (!msg.readBy || !msg.readBy[userId]))
            .map((msg) => msg.id)

          if (unreadMessageIds.length > 0) {
            markMessagesAsRead(chatRoomId, userId, unreadMessageIds).catch((err) => {
              console.error('Failed to mark messages as read:', err)
            })
          }
        },
        (err) => {
          console.error('Real-time subscription error:', err)
          setError('Lost connection to chat. Attempting to reconnect...')
          setIsConnected(false)
        }
      )
    } catch (err) {
      console.error('Failed to subscribe to messages:', err)
      setError('Failed to load chat messages')
      setLoading(false)
    }

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
      }
    }
  }, [chatRoomId, userId])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newMessage.trim()) return

    try {
      setSending(true)
      setError('')

      await sendRealtimeMessage(chatRoomId, userId, senderName, senderType, newMessage)
      setNewMessage('')
    } catch (err) {
      console.error('Failed to send message:', err)
      setError('Failed to send message. Check your connection.')
    } finally {
      setSending(false)
    }
  }

  if (loading && !isRealtimeDbConfigured()) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-red-600 flex flex-col items-center gap-2">
          <AlertCircle className="w-8 h-8" />
          <p className="text-sm">{error || 'Real-time chat not available'}</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500">Connecting to chat...</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b bg-gradient-to-r from-slate-50 to-slate-100">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-gray-900">Live Chat Support</h3>
          {!isConnected ? (
            <WifiOff className="w-4 h-4 text-red-500" />
          ) : (
            <Wifi className="w-4 h-4 text-green-500" />
          )}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Connection Status */}
      {!isConnected && (
        <div className="px-4 py-2 bg-yellow-50 border-b border-yellow-200 text-sm text-yellow-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          Reconnecting...
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {error && !isConnected && (
          <div className="text-sm text-amber-700 bg-amber-50 p-3 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-12">
            <p className="font-medium">No messages yet</p>
            <p className="text-sm mt-1">Start a conversation now!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.senderId === userId
            const isRead = msg.readBy && msg.readBy[userId]

            return (
              <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs px-4 py-3 rounded-lg ${
                  isOwn
                    ? 'bg-indigo-600 text-white rounded-br-none'
                    : 'bg-white text-gray-900 border border-gray-200 rounded-bl-none'
                }`}>
                  <p className={`text-xs font-semibold mb-1 ${isOwn ? 'text-indigo-100' : 'text-gray-600'}`}>
                    {msg.senderName}
                  </p>
                  <p className="text-sm break-words">{msg.message}</p>
                  <div className={`text-xs mt-2 flex items-center gap-1 ${
                    isOwn ? 'text-indigo-100' : 'text-gray-500'
                  }`}>
                    <time>
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </time>
                    {isOwn && (
                      <span className="ml-1">
                        {isRead ? '✓✓' : '✓'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-white">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            disabled={sending || !isConnected}
            maxLength={500}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
          />
          <button
            type="submit"
            disabled={sending || !newMessage.trim() || !isConnected}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition flex items-center gap-2 font-medium"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        {newMessage.length > 450 && (
          <p className="text-xs text-gray-500 mt-1">{500 - newMessage.length} characters left</p>
        )}
      </div>
    </div>
  )
}
