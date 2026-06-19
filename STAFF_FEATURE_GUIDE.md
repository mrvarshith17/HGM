# Enhanced Staff/Barber Selection Feature

## Complete Staff Profile System

Your staff management system now includes comprehensive profiles where salon owners can add detailed information about their stylists and staff members.

---

## Staff Profile Fields

### Basic Information
- **Name** - Staff member's full name
- **Specialization** - Main expertise (e.g., "Hair Cutting Specialist", "Color Expert")
- **Profile Picture** - Photo URL (displays as circular avatar)

### Experience & Credentials
- **Years of Experience** - Numeric value (e.g., 5, 10)
- **Certifications & Awards** - Multiple entries (e.g., "International Hair Styling Certification")

### Services
- **Services Offered** - Multiple service entries (e.g., Haircut, Coloring, Styling, Perming, etc.)
  - Add unlimited services
  - Each staff member can offer different services

### Additional Info
- **Bio** - Detailed description of expertise, achievements, and specialties
- **Rating & Reviews** - Auto-calculated from customer reviews (4.8 ⭐ 45 reviews)

---

## User Interfaces

### 1. **Salon Owner Dashboard** - Staff Management
**Path:** `/dashboard/owner/staff`

**Features:**
- ✅ View all salons you own
- ✅ Add new staff members with full profile details
- ✅ Edit existing staff member information
- ✅ Delete staff members
- ✅ Display staff with profile pictures and quick info
- ✅ Add multiple services and certifications
- ✅ Bulk service management

**Screenshot Layout:**
```
Left Side (2/3 width):
├── Salon Selector Dropdown
├── Error/Success Messages
└── Add/Edit Staff Form
    ├── Basic Information
    ├── Experience & Bio
    ├── Services (+ Add More)
    ├── Certifications (+ Add More)
    └── [Update/Add Button]

Right Side (1/3 width):
└── Your Staff List
    ├── Staff Count
    └── Staff Cards
        ├── Profile Picture
        ├── Name & Specialization
        ├── Years of Experience
        ├── Services (first 2 + count)
        ├── Rating & Reviews
        └── [Edit] [Delete]
```

### 2. **Customer Salon Page** - Browse Staff
**Path:** `/salon/[id]/staff`

**Features:**
- ✅ View all stylists at a salon with full profiles
- ✅ See specialization, experience, services, and certifications
- ✅ View ratings and reviews
- ✅ Select preferred stylist
- ✅ "Book with Any Available" option
- ✅ Navigate to booking with preselected stylist

### 3. **Staff Selector Component** (Flexible)
**Location:** `components/staff-selector.tsx`

**Two Modes:**
1. **Inline Mode** - Simple dropdown (for compact spaces)
   ```tsx
   <StaffSelector
     salonId="salon-123"
     selectedStaffId={staffId}
     onSelect={setStaffId}
     inline={true}
   />
   ```

2. **Card Mode** - Full profile cards (for dedicated pages)
   ```tsx
   <StaffSelector
     salonId="salon-123"
     selectedStaffId={staffId}
     onSelect={setStaffId}
   />
   ```

### 4. **Staff Profile Card Component**
**Location:** `components/staff-profile-card.tsx`

**Displays:**
- Profile picture (circular with initials fallback)
- Name and specialization
- Rating and review count
- Years of experience
- Bio text
- Services as blue badge pills
- Certifications with checkmarks
- Optional selection checkbox

---

## Database Schema

### Staff Collection Fields
```javascript
{
  staffId: "uuid",
  salonId: "salon-id",
  name: "Rahul Kumar",
  specialization: "Hair Cutting Specialist",
  bio: "Expert in modern haircuts with 8 years of experience...",
  profilePicture: "https://...",
  yearsExperience: 8,
  services: [
    "Haircut",
    "Fade",
    "Beard Trim",
    "Hair Coloring"
  ],
  certifications: [
    "International Hair Styling Certification",
    "Advanced Color Technique Certificate"
  ],
  rating: 4.8,
  reviewCount: 45,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### Updated Salon Collection
```javascript
{
  // ... existing fields
  staffMembers: ["staff-uuid-1", "staff-uuid-2", ...]
}
```

### Updated Booking Collection
```javascript
{
  // ... existing fields
  staffId: "staff-uuid" | null
}
```

---

## API Endpoints

### Staff Management APIs

#### Add Staff Member
```
POST /api/salons/[salonId]/staff
Body: {
  name: string,
  specialization: string,
  bio?: string,
  profilePicture?: string,
  yearsExperience?: number,
  services: string[],
  certifications?: string[]
}
```

#### Get Salon Staff
```
GET /api/salons/[salonId]/staff
Response: { data: Staff[] }
```

#### Get Staff Member
```
GET /api/salons/[salonId]/staff/[staffId]
Response: Staff object
```

#### Update Staff Member
```
PUT /api/salons/[salonId]/staff/[staffId]
Body: Partial Staff object
```

#### Delete Staff Member
```
DELETE /api/salons/[salonId]/staff/[staffId]
Response: { message: "Staff member deleted successfully" }
```

---

## Integration Guide

### Step 1: Add Staff Selector to Booking Form
```tsx
import { StaffSelector } from '@/components/staff-selector'

export default function BookingForm() {
  const [staffId, setStaffId] = useState<string | null>(null)
  const [salonId] = useState('salon-123')

  return (
    <form>
      {/* Other booking fields */}
      
      <StaffSelector
        salonId={salonId}
        selectedStaffId={staffId}
        onSelect={setStaffId}
        inline={true}  // Use dropdown mode
      />

      {/* Submit button */}
    </form>
  )
}
```

### Step 2: Include Staff ID in Booking
```tsx
const bookingData = {
  userId,
  salonId,
  staffId: staffId || null,  // Include staff selection
  appointmentDate,
  appointmentTime,
  // ... other fields
}

await createBooking(bookingData)
```

### Step 3: Add Staff Page Link in Navigation
```tsx
// For customers viewing salon details
<a href={`/salon/${salonId}/staff`} className="btn">
  👥 View Our Team
</a>

// In salon details page, add button to browse staff
<Button onClick={() => router.push(`/salon/${salonId}/staff`)}>
  Choose Your Stylist
</Button>
```

### Step 4: Update Booking Confirmation
Display which staff member was selected:
```tsx
{booking.staffId && (
  <p>Stylist: {booking.staff?.name} ({booking.staff?.specialization})</p>
)}
```

---

## Features Summary

### For Salon Owners ✅
- **Comprehensive Profiles** - Add name, bio, specialization, experience
- **Service Management** - List multiple services each staff member offers
- **Credentials** - Add certifications and awards
- **Photo Upload** - Staff profile pictures
- **Ratings** - Auto-calculated from customer reviews
- **Easy Management** - Edit, delete, or add new staff anytime

### For Customers ✅
- **Browse Stylists** - See all available staff at a salon
- **Detailed Profiles** - Review experience, services, certifications
- **Ratings & Reviews** - See community feedback (future feature)
- **Preference Selection** - Choose favorite stylist for booking
- **Flexible Options** - Book with any available staff if preferred

---

## Example Workflow

### Salon Owner Setup
1. Go to `/dashboard/owner/staff`
2. Select your salon
3. Click "Add New Staff Member"
4. Fill in:
   - Name: "Rahul"
   - Specialization: "Hair Cutting Specialist"
   - Years: 8
   - Bio: "Expert in modern cuts..."
   - Services: Haircut, Fade, Beard Trim, Coloring
   - Certifications: International Certification
   - Profile Picture: https://...
5. Click "Add Staff Member"
6. Staff member appears in list on right
7. Customers can now book with Rahul!

### Customer Booking with Staff
1. Search and find salon
2. Click "View Our Team" button
3. Browse stylists with profiles
4. Click "Select" on preferred stylist
5. Click "Book Appointment with Selected Stylist"
6. Complete booking form with staff pre-selected
7. Confirmation shows: "Haircut with Rahul at 2:00 PM"

---

## Future Enhancements

1. **Staff Availability Calendar** - Show available time slots per staff
2. **Staff Pricing** - Different prices for different stylists
3. **Staff-Specific Reviews** - Rate individual staff members
4. **Staff Performance Dashboard** - Monthly bookings, ratings, reviews
5. **Staff Schedule Management** - Set working hours and days off
6. **Staff Pricing Variations** - Premium rates for experienced stylists

---

## Styling & Theme

### Colors Used
- **Primary Blue**: `bg-blue-600`, `text-blue-600`
- **Slate Dark**: `bg-slate-900`, `text-slate-200`
- **Yellow Stars**: `fill-yellow-400`
- **Service Badges**: `bg-blue-100`, `text-blue-700`

### Responsive Design
- Mobile: Single column layout
- Tablet: 2 column grid
- Desktop: 3 column grid for staff display
- Admin panel: 2/3 + 1/3 split layout

---

## Troubleshooting

### Staff not appearing in list?
- Verify staff was added to correct salon
- Check browser console for API errors
- Ensure salonId matches booking salon

### Profile pictures not loading?
- Use valid HTTPS URL
- Test image URL in browser directly
- Check image file size (recommend < 2MB)

### Services not saving?
- Ensure at least one service is entered
- Services cannot be empty strings
- Try trimming whitespace

---

## API Response Examples

### Add Staff Response
```json
{
  "id": "staff-uuid-123",
  "staffId": "staff-uuid-123",
  "salonId": "salon-456",
  "name": "Rahul Kumar",
  "specialization": "Hair Cutting Specialist",
  "bio": "Expert in modern haircuts...",
  "yearsExperience": 8,
  "services": ["Haircut", "Fade", "Coloring"],
  "certifications": ["International Certification"],
  "rating": 0,
  "reviewCount": 0,
  "createdAt": "2024-06-15T10:00:00Z"
}
```

### Get Staff List Response
```json
{
  "data": [
    {
      "id": "staff-uuid-1",
      "name": "Rahul",
      "specialization": "Hair Cutting",
      "services": ["Haircut", "Fade"],
      "yearsExperience": 8,
      "rating": 4.8,
      "reviewCount": 45
    },
    {
      "id": "staff-uuid-2",
      "name": "Priya",
      "specialization": "Color Expert",
      "services": ["Coloring", "Highlights"],
      "yearsExperience": 6,
      "rating": 4.9,
      "reviewCount": 32
    }
  ]
}
```

---

## Component Tree

```
App
├── Dashboard (Owner)
│   └── Staff Management Page
│       ├── Salon Selector
│       ├── Add/Edit Form
│       │   ├── Basic Info Input
│       │   ├── Services Manager
│       │   └── Certifications Manager
│       └── Staff List
│           └── Staff List Item
│
├── Salon Detail Page
│   └── Browse Staff Link → Staff Browse Page
│       ├── Staff Grid
│       └── Staff Profile Card (x multiple)
│
└── Booking Flow
    ├── Staff Selector Component
    │   ├── Inline Mode (Dropdown)
    │   └── Card Mode (Full Profiles)
    └── Staff Profile Card (Selectable)
```

---

Enjoy your enhanced staff management system! 🎉
