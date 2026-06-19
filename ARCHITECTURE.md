# HGM Architecture Documentation

## System Overview

HGM (Hyderabad Grooming Marketplace) is a full-stack web application built with a **modern JavaScript/TypeScript stack**. The architecture separates concerns into frontend (React/Next.js) and backend (Express/Node.js) with Firebase as the data layer.

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT BROWSER                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │          Next.js 16 React Application               │   │
│  │  ┌────────────────┐         ┌────────────────────┐  │   │
│  │  │  Pages/Routes  │         │  Components        │  │   │
│  │  │  - Home        │         │  - Navigation      │  │   │
│  │  │  - Auth        │         │  - Forms           │  │   │
│  │  │  - Search      │         │  - Cards           │  │   │
│  │  │  - Dashboards  │         │  - Buttons         │  │   │
│  │  └────────────────┘         └────────────────────┘  │   │
│  │           ↑                           ↑             │   │
│  │           └───────────────┬───────────┘             │   │
│  │                       HTTP                         │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────┬──────────────────────────────────┘
                          │
                     HTTP/REST
                          │
┌─────────────────────────▼──────────────────────────────────┐
│                    BACKEND SERVER                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │       Express.js Server (Node.js)                   │  │
│  │  ┌────────────────┐         ┌────────────────────┐  │  │
│  │  │   API Routes   │         │  Controllers       │  │  │
│  │  │  - /auth       │         │  - Validate input  │  │  │
│  │  │  - /salons     │         │  - Business logic  │  │  │
│  │  │  - /bookings   │         │  - Error handling  │  │  │
│  │  │  - /dashboard  │         │  - Response format │  │  │
│  │  └────────────────┘         └────────────────────┘  │  │
│  │           ↑                           ↑              │  │
│  │           └───────────────┬───────────┘              │  │
│  │                    Internal routing                 │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────┬──────────────────────────────────┘
                          │
                   Firebase SDK
                          │
┌─────────────────────────▼──────────────────────────────────┐
│              FIREBASE BACKEND SERVICES                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Firestore Database (NoSQL)                         │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────────────────┐ │  │
│  │  │  Users   │ │  Salons  │ │  Bookings (Indexed)  │ │  │
│  │  └──────────┘ └──────────┘ └──────────────────────┘ │  │
│  │  ┌──────────┐ ┌─────────────┐ ┌─────────────────┐   │  │
│  │  │ Reviews  │ │ Favorites   │ │ Hairstyle Prev. │   │  │
│  │  └──────────┘ └─────────────┘ └─────────────────┘   │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ↓                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Firebase Authentication                            │  │
│  │  - Email/Password Auth                              │  │
│  │  - Session Management                               │  │
│  │  - User ID Generation                               │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘

Additional Services:
┌──────────────────────────────────────────────────────────────┐
│  ┌─────────────────┐                                         │
│  │ Replicate API   │                                         │
│  │ (AI Preview)    │                                         │
│  └─────────────────┘                                         │
└──────────────────────────────────────────────────────────────┘
```

## Data Flow

### User Registration Flow
```
Client (Registration Form)
    ↓
POST /api/auth/register
    ↓
Express Route Handler
    ↓
Firebase Admin SDK
    ↓
Firebase Auth (Create User)
    ↓
Firestore (Create User Doc)
    ↓
Return {uid, email} to Client
    ↓
Store in localStorage
    ↓
Redirect to Dashboard
```

### Salon Booking Flow
```
Client (Salon Detail Page)
    ↓
Fill Booking Form (Date, Time, Notes)
    ↓
POST /api/bookings
    ↓
Express Route Handler
    ↓
Validate Input
    ↓
Generate Booking ID (UUID)
    ↓
Save to Firestore
    ↓
Return {bookingId} to Client
    ↓
Show Confirmation
    ↓
Redirect to Dashboard
```

### Search/Filter Flow
```
Client (Search Page)
    ↓
GET /api/salons?search=name&city=Hyderabad
    ↓
Express Route Handler
    ↓
Firestore Query
    ↓
Filter Results
    ↓
Return Array of Salons
    ↓
Display in Grid
```

## Frontend Architecture

### Pages (App Router Structure)

```
app/
├── page.tsx                      # Landing page (home)
├── layout.tsx                    # Root layout wrapper
├── globals.css                   # Global styles & theme
│
├── auth/
│   ├── login/page.tsx           # Login form
│   └── register/page.tsx        # Registration form
│
├── search/
│   └── page.tsx                 # Salon discovery & search
│
├── salon/[id]/
│   └── page.tsx                 # Salon detail & booking
│
├── dashboard/
│   ├── user/page.tsx            # Customer bookings
│   └── salon/page.tsx           # Salon owner dashboard
│
├── profile/
│   └── page.tsx                 # User profile (future)
│
└── api/                         # Next.js API routes (proxy)
    ├── auth/
    │   ├── register/route.ts
    │   ├── login/route.ts
    │   └── logout/route.ts
    ├── salons/
    │   ├── route.ts             # GET /salons
    │   └── [id]/
    │       ├── route.ts         # GET /salons/:id
    │       └── reviews/route.ts # GET /salons/:id/reviews
    ├── bookings/
    │   ├── route.ts             # POST /bookings
    │   ├── [id]/
    │   │   ├── route.ts         # PUT /bookings/:id
    │   │   └── cancel/route.ts  # POST /bookings/:id/cancel
    │   └── user/[id]/route.ts   # GET /bookings/user/:id
    └── dashboard/
        └── salon/[id]/route.ts  # GET /dashboard/salon/:id
```

### Component Hierarchy

```
<RootLayout>
  <Navigation />  (Sticky header with nav)
  <Page>
    ├── <HeroSection />
    ├── <FeaturesSection />
    ├── <SalonGrid />
    │   ├── <SalonCard />
    │   │   ├── <StarRating />
    │   │   ├── <ServiceTags />
    │   │   └── <BookButton />
    ├── <BookingForm />
    │   ├── <DatePicker />
    │   ├── <TimePicker />
    │   └── <TextArea />
    └── <DashboardTable />
        ├── <BookingRow />
        │   ├── <StatusBadge />
        │   └── <ActionButtons />
  </Page>
</RootLayout>
```

### State Management

**Client-side State:**
- `useAuth()` hook - User authentication & profile
- `useState()` - Component-level form state
- `localStorage` - Session persistence

**Server-side State:**
- Firebase Firestore - Persistent data storage
- Firebase Authentication - User session management

## Backend Architecture

### Express Server Structure

```
server.js (Entry Point)
    ↓
Initialize Express App
    ↓
Initialize Firebase Admin SDK
    ↓
Initialize Firestore & Auth
    ↓
Mount Route Handlers
    ↓
Listen on PORT (5000)

Routes:
├── /api/auth              (routes/auth.js)
│   ├── POST /register
│   ├── POST /login
│   ├── POST /logout
│   └── GET /profile/:uid
│
├── /api/salons            (routes/salons.js)
│   ├── GET /              # List with filters
│   ├── GET /:id           # Detail view
│   ├── POST /             # Create salon
│   ├── PUT /:id           # Update salon
│   ├── POST /:id/reviews  # Add review
│   └── GET /:id/reviews   # Get reviews
│
├── /api/bookings          (routes/bookings.js)
│   ├── POST /             # Create booking
│   ├── GET /user/:id      # User bookings
│   ├── GET /salon/:id     # Salon bookings
│   ├── GET /:id           # Booking detail
│   ├── PUT /:id           # Update status
│   └── POST /:id/cancel   # Cancel booking
│
├── /api/users             (routes/users.js)
│   ├── GET /:id
│   ├── PUT /:id
│   ├── GET /:id/favorites
│   ├── POST /:id/favorites
│   └── DELETE /:id/favorites/:salonId
│
├── /api/hairstyle         (routes/hairstyle.js)
│   ├── POST /preview      # Generate preview
│   ├── GET /user/:id      # User previews
│   └── GET /styles/popular
│
└── /api/dashboard         (routes/dashboard.js)
    ├── GET /user/:id
    ├── GET /salon/:id
    └── GET /analytics/:id
```

### Request/Response Flow

```
Client Request
    ↓
Next.js API Route (/app/api/...)
    ↓
Forward to Express (/api/...)
    ↓
Route Handler (routes/*.js)
    ↓
Firestore Query
    ↓
Process Data
    ↓
Return JSON Response
    ↓
Next.js Proxy
    ↓
Client Receives Response
```

## Database Design

### Firestore Collections

#### `users` Collection
```json
{
  "uid": "user_123",
  "email": "user@example.com",
  "name": "John Doe",
  "phone": "+91 9876543210",
  "userType": "customer",  // or "salon_owner"
  "profilePicture": "https://...",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

#### `salons` Collection
```json
{
  "salonId": "salon_123",
  "ownerId": "user_123",
  "name": "Prestige Salon",
  "address": "123 Main St",
  "city": "Hyderabad",
  "phone": "+91 8765432100",
  "email": "info@salon.com",
  "services": ["Hair Cut", "Coloring", "Perm"],
  "operatingHours": {
    "monday": "10:00-20:00",
    "tuesday": "10:00-20:00"
  },
  "latitude": 17.3850,
  "longitude": 78.4867,
  "rating": 4.5,
  "reviewCount": 24,
  "description": "Premium salon...",
  "profilePicture": "https://...",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

#### `bookings` Collection
```json
{
  "bookingId": "booking_123",
  "userId": "user_123",
  "salonId": "salon_123",
  "appointmentDate": "2024-02-20",
  "appointmentTime": "14:00",
  "status": "confirmed",  // pending, completed, cancelled
  "notes": "Hair cut with fade",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

**Indexes Required:**
- `bookings`: `userId + appointmentDate`
- `bookings`: `salonId + appointmentDate`
- `reviews`: `salonId + createdAt`

## Authentication Flow

```
1. User Registration
   - Submit form with email, password
   - Firebase Auth creates user account
   - Custom user doc created in Firestore
   - uid returned and stored in localStorage

2. User Login
   - Submit email/password
   - Verify against Firebase Auth
   - Retrieve user doc from Firestore
   - Store user data in localStorage
   - Token stored in localStorage (client-side)

3. Session Check
   - On app load, check localStorage
   - Verify token still exists
   - Load user data into app state
   - Redirect if not authenticated

4. Protected Routes
   - Check for authToken in localStorage
   - Redirect to /auth/login if missing
   - Display user-specific content if present
```

## Error Handling

### Frontend
```
Try-Catch Blocks
    ↓
Display User-Friendly Error Messages
    ↓
Alert or Toast Notifications
    ↓
Log to Console (dev)
```

### Backend
```
Express Route Handler
    ↓
Try-Catch Block
    ↓
Validate Input
    ↓
Firebase Operation
    ↓
Handle Errors
    ├── 400: Bad Request
    ├── 401: Unauthorized
    ├── 404: Not Found
    └── 500: Server Error
    ↓
JSON Response with Error Message
```

## Performance Considerations

1. **Frontend:**
   - Static pages prerendered at build time
   - Dynamic pages rendered on-demand
   - Image optimization with Next.js Image component
   - CSS-in-JS for minimal bundle size

2. **Backend:**
   - Firestore indexes for fast queries
   - Async/await for non-blocking operations
   - Connection pooling (Firebase handles)

3. **Database:**
   - Firestore real-time capabilities
   - Automatic scaling
   - Geoqueries for location-based search (future)

## Security Measures

1. **Frontend:**
   - localStorage for session tokens (secure for demo)
   - Password fields masked
   - Form validation

2. **Backend:**
   - Input validation on all endpoints
   - Parameterized queries (Firestore native)
   - Error messages don't expose sensitive info

3. **Firebase:**
   - Security Rules (to be configured)
   - Admin SDK for backend operations
   - Authentication tokens for API requests

## Future Enhancements

```
Payment Integration
    ↓
Real-time Notifications
    ↓
Video Consultations
    ↓
Advanced Search Filters
    ↓
Machine Learning Recommendations
    ↓
Mobile App (React Native)
```

## Deployment Architecture

```
Development:
Frontend: localhost:3000
Backend: localhost:5000

Production:
Frontend: Vercel (CDN, auto-deploy)
Backend: Render/Railway (Container, auto-scale)
Database: Firebase (Managed, global CDN)
```

## Dependencies Overview

**Frontend:**
- React 19 - UI library
- Next.js 16 - Framework
- TypeScript - Type safety
- Tailwind CSS - Styling
- shadcn/ui - Component library
- Lucide React - Icons

**Backend:**
- Express 5 - Web framework
- Firebase Admin - Database & Auth
- Replicate - AI APIs
- UUID - ID generation
- CORS - Cross-origin

**Database:**
- Firestore - NoSQL database
- Firebase Auth - User management

This architecture ensures scalability, maintainability, and provides a solid foundation for future enhancements.
