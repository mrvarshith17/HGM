# Feature Integration Guide

## Features Added

### 1. Staff/Barber Selection ✅
### 2. Real-Time Chat (Firebase Realtime Database) ✅

---

## Database Collections

### New Firestore Collections Created:
- `staff` - Staff member profiles
- `chatRooms` - Chat conversation rooms
- `messages` - Chat messages

### Updated Collections:
- `salons` - Added `staffMembers: string[]` field
- `bookings` - Added `staffId: string | null` field

---

## Files Created

### Services (`/lib/`)
- ✅ `db-staff-service.ts` - Staff management API client
- ✅ `db-chat-service.ts` - Chat API client

### API Routes (`/app/api/`)

#### Staff Management
- ✅ `POST /api/salons/[id]/staff` - Add staff member
- ✅ `GET /api/salons/[id]/staff` - Get salon staff
- ✅ `GET /api/salons/[id]/staff/[staffId]` - Get staff details
- ✅ `PUT /api/salons/[id]/staff/[staffId]` - Update staff
- ✅ `DELETE /api/salons/[id]/staff/[staffId]` - Delete staff

#### Chat
- ✅ `POST /api/chat/rooms` - Create chat room
- ✅ `GET /api/chat/rooms/[roomId]` - Get room details
- ✅ `GET /api/chat/rooms/user/[userId]` - Get user's chat rooms
- ✅ `GET /api/chat/rooms/salon/[salonId]` - Get salon's chat rooms
- ✅ `GET /api/chat/rooms/[roomId]/messages` - Get messages
- ✅ `POST /api/chat/messages` - Send message
- ✅ `PUT /api/chat/rooms/[roomId]/mark-read` - Mark as read

### Components (`/components/`)
- ✅ `staff-selector.tsx` - Staff selection dropdown
- ✅ `chat-widget.tsx` - Chat UI component

### Pages
- ✅ `/app/dashboard/owner/staff/page.tsx` - Staff management dashboard
- ✅ `/app/dashboard/owner/chat/page.tsx` - Salon owner chat page
- ✅ `/app/dashboard/user/chat/page.tsx` - Customer chat page

---

## Integration Steps

### Step 1: Update Booking Page to Include Staff Selection

**File: `/app/dashboard/user/page.tsx` or your booking page**

```tsx
'use client'

import { StaffSelector } from '@/components/staff-selector'
import { useState } from 'react'

export default function BookingPage() {
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null)
  const [salonId, setSalonId] = useState('') // Get from URL or context
  
  // In your booking form:
  return (
    <form onSubmit={handleBooking}>
      {/* ... other form fields ... */}
      
      <StaffSelector
        salonId={salonId}
        selectedStaffId={selectedStaffId}
        onSelect={setSelectedStaffId}
        optional={true}
      />
      
      {/* ... submit button ... */}
    </form>
  )
}
```

### Step 2: Update Booking Creation to Include Staff ID

**File: `/lib/db-booking-service.ts`** (Already updated)

When creating a booking, pass the `staffId`:

```tsx
const bookingData = {
  userId,
  salonId,
  staffId: selectedStaffId, // Add this
  appointmentDate,
  appointmentTime,
  // ... other fields
}

await createBooking(bookingData)
```

### Step 3: Add Chat Initialization After Booking

After a booking is created, automatically create a chat room:

```tsx
import { createChatRoom } from '@/lib/db-chat-service'

// After successful booking
const chatRoom = await createChatRoom({
  bookingId: booking.id,
  userId: currentUserId,
  salonId: booking.salonId,
  staffId: booking.staffId || undefined,
  participants: [currentUserId, booking.salonId],
})
```

### Step 4: Add Chat Widget to Booking Confirmation

**File: `/app/dashboard/user/page.tsx`** (Booking list/details page)

```tsx
import { ChatWidget } from '@/components/chat-widget'

export default function BookingDetails() {
  const [showChat, setShowChat] = useState(false)
  
  return (
    <div>
      {/* Booking details */}
      <button onClick={() => setShowChat(!showChat)}>
        💬 Chat with Salon Owner
      </button>
      
      {showChat && (
        <ChatWidget
          chatRoomId={booking.chatRoomId}
          userId={userId}
          senderName="Customer"
          senderType="user"
          onClose={() => setShowChat(false)}
        />
      )}
    </div>
  )
}
```

### Step 5: Add Navigation Links

Update your navigation components to include:

1. **For Salon Owners:**
   - `/dashboard/owner/staff` - Manage Staff
   - `/dashboard/owner/chat` - Customer Messages

2. **For Users:**
   - `/dashboard/user/chat` - Messages with Salons

**Example Navigation Update:**

```tsx
// In your navigation component
const ownerLinks = [
  { href: '/dashboard/owner', label: 'Dashboard' },
  { href: '/dashboard/owner/bookings', label: 'Bookings' },
  { href: '/dashboard/owner/staff', label: 'Manage Staff' }, // NEW
  { href: '/dashboard/owner/chat', label: 'Messages' }, // NEW
]

const userLinks = [
  { href: '/dashboard/user', label: 'My Bookings' },
  { href: '/dashboard/user/chat', label: 'Messages' }, // NEW
]
```

---

## Key Features

### Staff Selection Feature

✅ **Salon Owners Can:**
- Add individual staff members with name, specialization, bio, and photo
- Edit staff profiles
- Delete staff members
- View staff ratings and review count

✅ **Customers Can:**
- View available staff at a salon
- Select a specific staff member when booking
- See staff ratings before selecting

### Real-Time Chat Feature

✅ **Real-Time Messaging:**
- Customers can chat with salon owners
- Chat automatically creates upon booking
- Message polling (updates every 2 seconds)
- Automatic chat room creation per booking

✅ **For Salon Owners:**
- View all customer conversations
- Reply to customer inquiries
- See last message preview
- Organize conversations by customer

✅ **For Customers:**
- View all salon conversations
- Ask questions before appointment
- Get quick responses from salon
- Chat history preserved

---

## Storage & Persistence

### Local Storage Used For:
- `userId` - Current user ID
- `userEmail` - Current user email (for salon owners)
- `salonId` - Current salon ID (for salon owners)

### Firebase Firestore Used For:
- Staff profiles and availability
- Chat rooms and messages
- Chat history

---

## Environment Variables (if needed)

No additional environment variables required beyond your existing Firebase configuration.

---

## Testing the Features

### Test Staff Selection:
1. Go to `/dashboard/owner/staff`
2. Add a staff member with name and specialization
3. Create a booking and verify staff dropdown shows the member
4. Select the staff member and complete booking

### Test Chat:
1. Create a booking with a staff member
2. Navigate to `/dashboard/user/chat`
3. See the salon in conversations list
4. Send a message
5. Go to `/dashboard/owner/chat` to verify message received
6. Reply from owner side
7. Verify message appears in customer's chat

---

## Next Steps (Optional Enhancements)

1. **Socket.IO Integration** - Replace polling with real Socket.IO for true real-time updates
   - Install: `npm install socket.io socket.io-client`
   - Update `server.js` to initialize Socket.IO
   - Replace polling logic in `chat-widget.tsx`

2. **Staff Availability Calendar** - Show available time slots per staff member

3. **Staff Reviews** - Allow customers to rate specific staff members

4. **Video Chat** - Integrate Twilio or similar for video consultations

5. **Chat Notifications** - Add notifications when new messages arrive

6. **Chat History** - Archive and search old conversations

---

## Troubleshooting

### Chat Messages Not Appearing?
- Verify Firestore indexes exist for chatRooms collection
- Check browser console for errors
- Verify user IDs match between booking and chat

### Staff Dropdown Empty?
- Verify staff were added via admin panel
- Check Firestore for staff collection documents
- Verify salonId matches between request and stored staff

### Permissions Issues?
- Ensure Firestore security rules allow read/write for staff and messages
- Check Firebase rules in console

---

## API Response Examples

### Add Staff
```json
{
  "id": "uuid-staff-123",
  "staffId": "uuid-staff-123",
  "salonId": "salon-456",
  "name": "Rahul",
  "specialization": "Haircut",
  "bio": "Expert in modern haircuts",
  "rating": 4.8,
  "reviewCount": 45,
  "createdAt": "2024-06-15T10:00:00Z"
}
```

### Send Message
```json
{
  "id": "uuid-msg-789",
  "messageId": "uuid-msg-789",
  "chatRoomId": "uuid-room-456",
  "senderId": "user-123",
  "senderType": "user",
  "senderName": "John",
  "message": "Hi, can I get an appointment tomorrow?",
  "timestamp": "2024-06-15T10:30:00Z",
  "read": false
}
```

---

## Summary

Both features are now fully implemented and ready to integrate into your existing booking flow. The staff selection allows customers to book with specific stylists, and the real-time chat enables direct communication between customers and salon owners/staff before and after their appointments.
