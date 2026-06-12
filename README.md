# HGM - Hyderabad Grooming Marketplace

A full-stack salon discovery and appointment booking platform with AI-powered hairstyle preview capabilities.

## Project Structure

```
.
├── app/                          # Next.js App Router
│   ├── api/                     # API proxy routes
│   ├── auth/                    # Authentication pages (login, register)
│   ├── dashboard/               # User and salon owner dashboards
│   ├── salon/                   # Salon detail page
│   ├── search/                  # Salon search/discovery page
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Home page
│   └── globals.css             # Global styles
├── components/                  # React components
│   ├── navigation.tsx          # Navigation bar
│   └── ui/                     # shadcn UI components
├── hooks/                       # Custom React hooks
│   └── useAuth.ts              # Authentication hook
├── routes/                      # Express backend routes
│   ├── auth.js                 # Authentication endpoints
│   ├── bookings.js             # Booking endpoints
│   ├── dashboard.js            # Dashboard data endpoints
│   ├── hairstyle.js            # AI hairstyle endpoints
│   ├── salons.js               # Salon endpoints
│   └── users.js                # User profile endpoints
├── server.js                    # Express server entry point
├── firebase-key.json           # Firebase service account (DO NOT COMMIT)
├── .env.local                  # Environment variables
└── package.json               # Dependencies
```

## Setup Instructions

### Prerequisites

- Node.js 18+ and pnpm
- Firebase project with Firestore enabled
- Replicate API key (for hairstyle preview)
- Google Maps API key (for location mapping)

### 1. Environment Variables

Update `.env.local` with your credentials:

```env
# Firebase Configuration
FIREBASE_PROJECT_ID=hgm-app-40d28
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket

# API Keys
REPLICATE_API_TOKEN_2=your_replicate_api_key
GCP_API_KEY=your_google_maps_api_key

# Backend Configuration
PORT=5000
NODE_ENV=development

# Frontend Configuration
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### 2. Firebase Setup

The Firebase service account key is already provided in `firebase-key.json`. Ensure it's properly configured.

### 3. Install Dependencies

```bash
pnpm install
```

### 4. Start the Backend Server

In one terminal:

```bash
node server.js
```

The backend will run on `http://localhost:5000`

### 5. Start the Frontend (Next.js)

In another terminal:

```bash
pnpm dev
```

The frontend will run on `http://localhost:3000`

## Features

### For Customers

- **Salon Discovery**: Search and filter salons by location, services, and ratings
- **Detailed Salon Profiles**: View salon information, services, reviews, and photos
- **Appointment Booking**: Book appointments with preferred date/time and notes
- **User Dashboard**: Track upcoming and past appointments
- **AI Hairstyle Preview**: Preview hairstyles using AI (Replicate)

### For Salon Owners

- **Salon Management**: Create and manage salon profiles
- **Booking Dashboard**: View and manage appointments
- **Real-time Updates**: See bookings as they come in
- **Analytics**: Track booking history and completion rates
- **Customer Management**: View customer details and contact information

## Database Schema

### Collections

#### `users`
- uid (string, primary key)
- email (string)
- name (string)
- phone (string)
- userType (enum: 'customer' | 'salon_owner')
- profilePicture (string, optional)
- createdAt (timestamp)
- updatedAt (timestamp)

#### `salons`
- salonId (string, primary key)
- ownerId (string, foreign key to users)
- name (string)
- address (string)
- city (string)
- phone (string)
- email (string)
- services (array<string>)
- operatingHours (object)
- latitude (number)
- longitude (number)
- profilePicture (string)
- description (string)
- rating (number)
- reviewCount (number)
- createdAt (timestamp)
- updatedAt (timestamp)

#### `bookings`
- bookingId (string, primary key)
- userId (string, foreign key)
- salonId (string, foreign key)
- appointmentDate (string, YYYY-MM-DD)
- appointmentTime (string, HH:mm)
- notes (string)
- status (enum: 'pending' | 'confirmed' | 'cancelled' | 'completed')
- createdAt (timestamp)
- updatedAt (timestamp)

#### `reviews`
- reviewId (string, primary key)
- userId (string, foreign key)
- salonId (string, foreign key)
- rating (number, 1-5)
- comment (string)
- createdAt (timestamp)

#### `favorites`
- userId_salonId (string, primary key)
- userId (string, foreign key)
- salonId (string, foreign key)
- createdAt (timestamp)

#### `hairstyle_previews`
- previewId (string, primary key)
- userId (string, foreign key)
- originalImage (string, URL)
- hairstyleDescription (string)
- previewImage (string, URL)
- createdAt (timestamp)

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile/:uid` - Get user profile

### Salons
- `GET /api/salons` - List all salons (with filters)
- `GET /api/salons/:salonId` - Get salon details
- `POST /api/salons` - Create new salon
- `PUT /api/salons/:salonId` - Update salon
- `GET /api/salons/:salonId/reviews` - Get salon reviews
- `POST /api/salons/:salonId/reviews` - Add review

### Bookings
- `POST /api/bookings` - Create booking
- `GET /api/bookings/user/:userId` - Get user's bookings
- `GET /api/bookings/salon/:salonId` - Get salon's bookings
- `GET /api/bookings/:bookingId` - Get booking details
- `PUT /api/bookings/:bookingId` - Update booking
- `POST /api/bookings/:bookingId/cancel` - Cancel booking

### Users
- `GET /api/users/:userId` - Get user profile
- `PUT /api/users/:userId` - Update user profile
- `GET /api/users/:userId/favorites` - Get favorite salons
- `POST /api/users/:userId/favorites` - Add favorite salon
- `DELETE /api/users/:userId/favorites/:salonId` - Remove favorite

### Hairstyle
- `POST /api/hairstyle/preview` - Generate AI hairstyle preview
- `GET /api/hairstyle/user/:userId` - Get user's preview history
- `GET /api/hairstyle/styles/popular` - Get popular hairstyle styles

### Dashboard
- `GET /api/dashboard/user/:userId` - Get user dashboard data
- `GET /api/dashboard/salon/:salonId` - Get salon dashboard data
- `GET /api/dashboard/analytics/:salonId` - Get salon analytics

## Tech Stack

### Frontend
- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS
- shadcn/ui
- Lucide React (icons)

### Backend
- Node.js + Express
- Firebase Admin SDK
- Firebase Firestore
- Replicate API (AI hairstyle preview)
- Google Maps API

### Authentication
- Firebase Authentication
- JWT tokens (optional enhancement)

## Development

### Running Tests

```bash
# Frontend tests
pnpm test

# Backend tests
npm test
```

### Building for Production

```bash
# Build frontend
pnpm build

# Start production server
pnpm start
```

## Deployment

### Vercel (Frontend)
1. Push code to GitHub
2. Connect repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy

### Backend Deployment Options
- Render.com (Node.js)
- Railway.app
- DigitalOcean App Platform
- AWS Elastic Beanstalk
- Google Cloud Run

## Security Considerations

1. **Firebase Rules**: Set up Firestore security rules
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{uid} {
         allow read, write: if request.auth.uid == uid;
       }
       match /salons/{document=**} {
         allow read: if true;
         allow write: if request.auth.uid == get(/databases/$(database)/documents/salons/$(resource.id)).data.ownerId;
       }
       match /bookings/{document=**} {
         allow read, write: if request.auth != null;
       }
     }
   }
   ```

2. **Environment Variables**: Never commit `.env.local` or `firebase-key.json`

3. **API Authentication**: Add authentication checks to backend routes

4. **Rate Limiting**: Implement rate limiting for API endpoints

## Contributing

1. Create a feature branch
2. Make your changes
3. Submit a pull request

## License

MIT License - See LICENSE file for details

## Support

For issues or questions, please open a GitHub issue or contact the development team.
