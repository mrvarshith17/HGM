'use client'

import { useEffect, useRef, useState } from 'react'
import { getChatMessages, sendMessage, markMessagesAsRead } from '@/lib/db-chat-service'
import type { ChatMessage } from '@/lib/db-chat-service'
import { Send, X } from 'lucide-react'

interface ChatWidgetProps {
  chatRoomId: string
  userId: string
  senderName: string
  senderType: 'user' | 'owner' | 'staff'
  onClose?: () => void
}

export function ChatWidget({
  chatRoomId,
  userId,
  senderName,
  senderType,
  onClose,
}: ChatWidgetProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Load initial messages
  useEffect(() => {
    const loadMessages = async () => {
      try {
        setLoading(true)
        console.log('[Chat Widget] Loading messages for room:', chatRoomId)
        console.log('[Chat Widget] Sender details:', { userId, senderName, senderType })
        
        const response = await getChatMessages(chatRoomId)
        console.log('[Chat Widget] Response:', response)
        const loadedMessages = response.data || []
        console.log('[Chat Widget] Loaded', loadedMessages.length, 'messages')
        setMessages(loadedMessages)
        
        // Mark as read
        await markMessagesAsRead(chatRoomId, userId)
        setError('')
      } catch (err) {
        console.error('[Chat Widget] Failed to load messages:', err)
        setError('Failed to load chat messages')
      } finally {
        setLoading(false)
      }
    }

    loadMessages()
  }, [chatRoomId, userId])

  // Poll for new messages every 2 seconds
  useEffect(() => {
    const pollMessages = async () => {
      try {
        const response = await getChatMessages(chatRoomId)
        if (response.data) {
          console.log('[Chat Widget] Poll: Got', response.data.length, 'messages')
          setMessages(response.data)
        }
      } catch (err) {
        console.error('[Chat Widget] Failed to poll messages:', err)
      }
    }

    pollIntervalRef.current = setInterval(pollMessages, 2000)

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
      }
    }
  }, [chatRoomId])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newMessage.trim()) return

    try {
      setSending(true)
      console.log('[Chat Widget] Sending message:', {
        chatRoomId,
        senderId: userId,
        senderType,
        senderName,
        messageLength: newMessage.length,
      })
      
      await sendMessage({
        chatRoomId,
        senderId: userId,
        senderType,
        senderName,
        message: newMessage,
      })

      console.log('[Chat Widget] Message sent successfully')
      setNewMessage('')
      
      // Reload messages
      const response = await getChatMessages(chatRoomId)
      console.log('[Chat Widget] After send: Got', response.data?.length || 0, 'messages')
      setMessages(response.data || [])
      setError('')
    } catch (err) {
      console.error('[Chat Widget] Failed to send message:', err)
      setError(err instanceof Error ? err.message : 'Failed to send message')
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500">Loading chat...</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b">
        <h3 className="font-semibold text-gray-900">Chat Support</h3>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {error && (
          <div className="text-sm text-red-500 bg-red-50 p-2 rounded">
            {error}
          </div>
        )}

        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.messageId}
              className={`flex ${msg.senderId === userId ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs px-4 py-2 rounded-lg ${
                  msg.senderId === userId
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-900'
                }`}
              >
                <p className="text-xs font-semibold mb-1">{msg.senderName}</p>
                <p className="text-sm break-words">{msg.message}</p>
                <p className="text-xs mt-1 opacity-70">
                  {new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            disabled={sending}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
          />
          <button
            type="submit"
            disabled={sending || !newMessage.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  )
}
