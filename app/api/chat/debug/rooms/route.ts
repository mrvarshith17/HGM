import { NextRequest, NextResponse } from 'next/server'

// GET - Debug endpoint to see all rooms and messages
export async function GET(req: NextRequest) {
  try {
    // Import functions from memory-chat-store
    const memoryModule = await import('@/lib/memory-chat-store')
    
    // Call getAllStats to get summary
    const stats = memoryModule.getAllStats()
    
    // Get all rooms by salon or user
    const salonId = req.nextUrl.searchParams.get('salonId')
    const userId = req.nextUrl.searchParams.get('userId')
    
    let rooms: any[] = []
    let messages: Record<string, any[]> = {}
    let debugInfo = ''
    
    if (salonId) {
      const salonRooms = memoryModule.getSalonRooms(salonId)
      rooms = salonRooms
      
      // Get messages for each room
      for (const room of salonRooms) {
        const roomMessages = memoryModule.getRoomMessages(room.chatRoomId)
        messages[room.chatRoomId] = roomMessages.map(msg => ({
          messageId: msg.messageId,
          senderId: msg.senderId,
          senderType: msg.senderType,
          senderName: msg.senderName,
          message: msg.message.substring(0, 100), // First 100 chars
          timestamp: msg.timestamp,
        }))
      }
      
      debugInfo = `Salon ${salonId} has ${rooms.length} rooms with ${Object.values(messages).reduce((sum, msgs) => sum + msgs.length, 0)} total messages`
      
      console.log(`[Debug Chat API] ${debugInfo}`)
      console.log('[Debug Chat API] Rooms:', rooms.map(r => ({ 
        id: r.chatRoomId, 
        bookingId: r.bookingId,
        userId: r.userId, 
        messageCount: messages[r.chatRoomId]?.length || 0 
      })))
    }
    
    if (userId) {
      const userRooms = memoryModule.getUserRooms(userId)
      rooms = userRooms
      
      // Get messages for each room
      for (const room of userRooms) {
        const roomMessages = memoryModule.getRoomMessages(room.chatRoomId)
        messages[room.chatRoomId] = roomMessages.map(msg => ({
          messageId: msg.messageId,
          senderId: msg.senderId,
          senderType: msg.senderType,
          senderName: msg.senderName,
          message: msg.message.substring(0, 100),
          timestamp: msg.timestamp,
        }))
      }
      
      debugInfo = `User ${userId} has ${rooms.length} rooms with ${Object.values(messages).reduce((sum, msgs) => sum + msgs.length, 0)} total messages`
      
      console.log(`[Debug Chat API] ${debugInfo}`)
      console.log('[Debug Chat API] Rooms:', rooms.map(r => ({ 
        id: r.chatRoomId, 
        bookingId: r.bookingId,
        salonId: r.salonId, 
        messageCount: messages[r.chatRoomId]?.length || 0 
      })))
    }
    
    return NextResponse.json({
      status: 'ok',
      debugInfo,
      stats,
      rooms: rooms.map(r => ({
        chatRoomId: r.chatRoomId,
        bookingId: r.bookingId,
        userId: r.userId,
        salonId: r.salonId,
        staffId: r.staffId,
        participants: r.participants,
        createdAt: r.createdAt,
        lastMessage: r.lastMessage,
        messageCount: messages[r.chatRoomId]?.length || 0,
      })),
      messages,
      timestamp: new Date().toISOString(),
    }, { status: 200 })
  } catch (error) {
    console.error('[Debug Chat API] GET error:', error)
    return NextResponse.json(
      { error: 'Failed to get debug info', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
