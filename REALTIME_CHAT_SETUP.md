# Real-Time Chat Implementation Guide

Complete integration of Firebase Realtime Database for live chat between customers and salon owners.

## Overview

This implementation provides:
- ✅ **Instant Message Delivery** - Real-time message updates using Firebase Realtime Database
- ✅ **Live Connection Status** - Shows when connection is active/offline
- ✅ **Message Read Receipts** - Track which messages have been read by recipients
- ✅ **Automatic Reconnection** - Gracefully handles connection loss
- ✅ **Fallback Support** - Works with both Firestore and Realtime Database
- ✅ **Unread Counts** - Track unread messages per chat room
- ✅ **Message History** - Archives messages in Firestore for long-term storage

## Prerequisites

### 1. Firebase Project Configuration

You need Firebase Realtime Database enabled. Go to [Firebase Console](https://console.firebase.google.com):

1. Select your project
2. Go to **Build → Realtime Database**
3. Click **Create Database**
4. Choose **Locked mode** for development (or your preferred security rules)
5. Select region (close to your users)
6. Copy the **Database URL** (looks like: `https://your-project.firebaseio.com`)

### 2. Environment Variables

Add these to `.env.local`:

```bash
# Existing Firebase config
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# NEW: Realtime Database URL
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your_project.firebaseio.com

# Server-side (optional, for sync operations)
FIREBASE_REALTIME_DB_URL=https://your_project.firebaseio.com
```

### 3. Firebase Realtime Database Security Rules

Set these rules in Firebase Console → Realtime Database → Rules:

```json
{
  "rules": {
    "chatRooms": {
      "$chatRoomId": {
        ".read": true,
        ".write": "root.child('chatRooms').child($chatRoomId).child('participants').val().contains(auth.uid) || auth.uid !== null",
        "messages": {
          ".read": true,
          "$messageId": {
            ".write": "root.child('chatRooms').child($chatRoomId).child('participants').val().contains(auth.uid) || auth.uid !== null"
          }
        }
      }
    }
  }
}
```

## Installation

### 1. Install Dependencies

```bash
npm install firebase
```

### 2. File Structure

New files added:
```
lib/
  ├── firebase-client.ts              # Client-side Firebase config
  └── realtime-chat-service.ts        # Real-time chat operations
components/
  └── chat-widget-realtime.tsx        # Real-time chat UI component
app/api/chat/
  ├── rooms/realtime/route.ts         # Chat room API
  └── messages/realtime/route.ts      # Chat message API
```

## Usage

### Basic Integration

```tsx
import { ChatWidgetRealtime } from '@/components/chat-widget-realtime'

export default function BookingPage() {
  const chatRoomId = 'your-chat-room-id'
  const userId = 'current-user-id'

  return (
    <ChatWidgetRealtime
      chatRoomId={chatRoomId}
      userId={userId}
      senderName="John Doe"
      senderType="user"
      onClose={() => console.log('Chat closed')}
    />
  )
}
```

### In a Modal or Sidebar

```tsx
import { useState } from 'react'
import { ChatWidgetRealtime } from '@/components/chat-widget-realtime'

export default function AppointmentDetail() {
  const [showChat, setShowChat] = useState(false)

  return (
    <div className="flex gap-4">
      <div className="flex-1">
        {/* Appointment details */}
      </div>
      
      {showChat && (
        <div className="w-96 h-96">
          <ChatWidgetRealtime
            chatRoomId="room-123"
            userId="user-456"
            senderName="Jane Smith"
            senderType="user"
            onClose={() => setShowChat(false)}
          />
        </div>
      )}
      
      <button
        onClick={() => setShowChat(!showChat)}
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        {showChat ? 'Close Chat' : 'Open Chat'}
      </button>
    </div>
  )
}
```

## API Reference

### Client-Side Services

#### `firebase-client.ts`

```typescript
// Get Firebase app instance
getFirebaseApp(): FirebaseApp

// Get Realtime Database instance
getRealtimeDb(): Database | null

// Check if Realtime DB is configured
isRealtimeDbConfigured(): boolean
```

#### `realtime-chat-service.ts`

**Send Message**
```typescript
await sendRealtimeMessage(
  chatRoomId: string,
  senderId: string,
  senderName: string,
  senderType: 'user' | 'owner' | 'staff',
  message: string
): Promise<RealtimeMessage>
```

**Create Chat Room**
```typescript
await createRealtimeChatRoom(roomData: {
  bookingId: string
  userId: string
  salonId: string
  staffId?: string
  participants: string[]
}): Promise<RealtimeChatRoom>
```

**Subscribe to Real-Time Messages**
```typescript
const unsubscribe = subscribeToMessages(
  chatRoomId: string,
  onMessagesChange: (messages: RealtimeMessage[]) => void,
  onError?: (error: Error) => void
): Unsubscribe
```

**Mark Messages as Read**
```typescript
await markMessagesAsRead(
  chatRoomId: string,
  userId: string,
  messageIds?: string[]
): Promise<void>
```

**Get Unread Count**
```typescript
const count = await getUnreadMessageCount(
  chatRoomId: string,
  userId: string
): Promise<number>
```

### Server-Side APIs

#### Create Chat Room
```
POST /api/chat/rooms/realtime

Body:
{
  bookingId: string,
  userId: string,
  salonId: string,
  staffId?: string,
  participants?: string[]
}

Response:
{
  id: string,
  chatRoomId: string,
  bookingId: string,
  userId: string,
  salonId: string,
  participants: string[],
  createdAt: Date,
  updatedAt: Date
}
```

#### Send Message
```
POST /api/chat/messages/realtime

Body:
{
  chatRoomId: string,
  senderId: string,
  senderType: 'user' | 'owner' | 'staff',
  senderName: string,
  message: string
}

Response:
{
  id: string,
  chatRoomId: string,
  senderId: string,
  senderName: string,
  message: string,
  timestamp: number,
  read: boolean
}
```

#### Get Messages
```
GET /api/chat/messages/realtime?chatRoomId=123&limit=50

Response:
{
  data: RealtimeMessage[]
}
```

## Features

### 1. Real-Time Message Delivery

Messages appear instantly without polling:

```typescript
// Component automatically updates when new messages arrive
subscribeToMessages(chatRoomId, (messages) => {
  setMessages(messages) // Instant update
})
```

### 2. Connection Status Indicator

Shows user connection state:

```tsx
{!isConnected && (
  <div className="bg-yellow-50 p-2 text-yellow-800">
    Reconnecting...
  </div>
)}
```

### 3. Read Receipts

Shows single (✓) or double (✓✓) checkmarks:

```typescript
// Message marked as read by recipient
await markMessagesAsRead(chatRoomId, userId)
```

### 4. Unread Badges

Count unread messages:

```typescript
const unreadCount = await getUnreadMessageCount(chatRoomId, userId)
// Use in badge: <span>{unreadCount}</span>
```

## Data Model

### Chat Room
```typescript
interface RealtimeChatRoom {
  id: string                    // Firebase key
  bookingId: string            // Associated booking
  userId: string               // Customer ID
  salonId: string              // Salon ID
  staffId?: string             // Optional staff member ID
  participants: string[]       // [userId, salonId]
  createdAt: number            // Timestamp (ms)
  updatedAt: number            // Last update timestamp
  lastMessage?: string         // Preview text
  lastMessageTime?: number     // Last message time
}
```

### Message
```typescript
interface RealtimeMessage {
  id: string                              // Firebase message key
  chatRoomId: string                     // Which room
  senderId: string                       // Who sent it
  senderName: string                     // Display name
  senderType: 'user' | 'owner' | 'staff'
  message: string                        // Message text
  timestamp: number                      // When sent (ms)
  read: boolean                          // Deprecated, use readBy
  readBy?: { [userId: string]: boolean } // Who read it
}
```

## Troubleshooting

### "Real-time chat is not configured"

**Issue:** Error message appears in chat widget.

**Solution:**
1. Check `.env.local` has `NEXT_PUBLIC_FIREBASE_DATABASE_URL` set
2. Verify the URL is correct in Firebase Console
3. Reload the page

### "Connection lost - Reconnecting"

**Issue:** Yellow warning appears and messages can't be sent.

**Causes:**
- Network connectivity issue
- Firebase project rate limited
- Invalid security rules

**Solutions:**
1. Check internet connection
2. Review Firebase Realtime Database rules
3. Check Firebase project quotas
4. Clear browser cache and refresh

### Messages not appearing in real-time

**Issue:** Messages appear after refresh but not immediately.

**Solution:**
1. Verify Realtime Database is enabled (not just Firestore)
2. Check security rules allow read/write
3. Ensure `NEXT_PUBLIC_FIREBASE_DATABASE_URL` is set
4. Check browser console for Firebase errors

### High latency or slow messages

**Optimize:**
1. Use a database region closer to users
2. Limit message history loaded (use `limitToLast()`)
3. Compress message payload
4. Implement message pagination

## Performance Considerations

1. **Database Size** - Each message stored = ~500 bytes. Monitor growth.
2. **Concurrent Connections** - Firebase Realtime DB has connection limits per project
3. **Read/Write Operations** - Each message = 2-3 database operations
4. **Archive Strategy** - Consider moving old messages to Firestore after 30 days

## Switching Between Polling and Real-Time

### Use Original Polling Component
```tsx
import { ChatWidget } from '@/components/chat-widget'

// Still supports 2-second polling if needed
<ChatWidget chatRoomId={id} userId={uid} senderName={name} senderType="user" />
```

### Use Real-Time Component
```tsx
import { ChatWidgetRealtime } from '@/components/chat-widget-realtime'

// Instant updates, requires Realtime Database
<ChatWidgetRealtime chatRoomId={id} userId={uid} senderName={name} senderType="user" />
```

## Next Steps

1. **Authentication** - Implement Firebase Authentication for production
2. **Message Notifications** - Add push notifications when new messages arrive
3. **Typing Indicators** - Show "User is typing..." status
4. **Media Sharing** - Support image/file uploads in chat
5. **Moderation** - Add message filtering and content moderation
6. **Analytics** - Track chat metrics and user engagement

## Security Best Practices

1. ✅ Use `.env.local` for API keys (never commit)
2. ✅ Set strict security rules in Realtime Database
3. ✅ Validate messages server-side before saving
4. ✅ Implement rate limiting for message sending
5. ✅ Archive old messages to Firestore for compliance
6. ✅ Implement message encryption for sensitive conversations

## References

- [Firebase Realtime Database Documentation](https://firebase.google.com/docs/database)
- [Firebase Security Rules](https://firebase.google.com/docs/database/security)
- [Firebase Limits](https://firebase.google.com/docs/database/usage/limits)
