# HGM Quick Start Guide

## What's Been Built

You have a complete full-stack salon discovery and booking platform with:

- **Frontend**: Next.js 16 with modern React 19 UI
- **Backend**: Express.js with Firebase integration
- **Database**: Firebase Firestore
- **Features**: Salon search, booking system, user & salon dashboards, AI preview ready

## Running the Application

### Option 1: Run Both Frontend and Backend Together

```bash
# Install dependencies (if not done)
pnpm install

# Terminal 1: Start the Express backend
node server.js

# Terminal 2: Start the Next.js frontend
pnpm dev
```

Then open:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api

### Option 2: Run Separately

**Backend (Terminal 1):**
```bash
node server.js
```

**Frontend (Terminal 2):**
```bash
pnpm dev
```

## Testing the Application

### 1. Create a Test Account

1. Go to http://localhost:3000
2. Click "Get Started"
3. Register as either:
   - **Customer**: To search salons and book appointments
   - **Salon Owner**: To manage a salon

**Test Credentials:**
- Email: test@example.com
- Password: password123
- Phone: +91 9876543210

### 2. Test User Flow

**As a Customer:**
1. Register with user type "Customer"
2. Go to "Find Salons"
3. Browse available salons
4. Click on a salon to see details
5. Book an appointment
6. View bookings in dashboard

**As a Salon Owner:**
1. Register with user type "Salon Owner"
2. Create a salon profile (visit /create-salon)
3. View bookings in dashboard
4. Update appointment statuses

## Important Environment Variables

You need these set in `.env.local`:

```env
# Firebase (already configured)
FIREBASE_PROJECT_ID=hgm-app-40d28

# Required for AI hairstyle preview
REPLICATE_API_TOKEN_2=your_replicate_api_key

# Required for location mapping
GCP_API_KEY=your_google_maps_api_key

# API URLs
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### Getting API Keys:

1. **Replicate API Key:**
   - Visit https://replicate.com
   - Sign up and go to API tokens
   - Copy your token to `REPLICATE_API_TOKEN_2`

2. **Google Maps API Key:**
   - Go to https://console.cloud.google.com
   - Create a new project
   - Enable Maps API
   - Create API key and add to `GCP_API_KEY`

## File Structure

```
Key Files You Should Know:

Frontend Pages:
- app/page.tsx                 → Landing page
- app/auth/login/page.tsx      → Login page
- app/auth/register/page.tsx   → Registration
- app/search/page.tsx          → Salon discovery
- app/salon/[id]/page.tsx      → Salon details & booking
- app/dashboard/user/page.tsx  → Customer appointments
- app/dashboard/salon/page.tsx → Salon owner dashboard

Backend Routes:
- routes/auth.js               → User authentication
- routes/salons.js             → Salon CRUD operations
- routes/bookings.js           → Appointment management
- routes/hairstyle.js          → AI hairstyle preview
- routes/dashboard.js          → Dashboard data

Components:
- components/navigation.tsx    → Top navigation bar
- hooks/useAuth.ts            → Auth state management
```

## Database Setup

Firebase Firestore is already configured. It will automatically create collections when you:

1. Register a user
2. Create a salon
3. Make a booking

**Collections created automatically:**
- `users` - User accounts
- `salons` - Salon profiles
- `bookings` - Appointments
- `reviews` - Salon reviews
- `favorites` - Bookmarked salons
- `hairstyle_previews` - AI preview history

## Common Issues & Solutions

### Issue: "Cannot connect to backend"
**Solution:** 
- Make sure backend is running: `node server.js`
- Check API URL in `.env.local`: `NEXT_PUBLIC_API_URL=http://localhost:5000/api`
- Verify port 5000 is not in use

### Issue: "Firebase error"
**Solution:**
- Ensure firebase-key.json exists in root directory
- Check Firebase project ID matches in `.env.local`
- Verify all environment variables are set

### Issue: "Replicate API error"
**Solution:**
- Get API key from https://replicate.com
- Add to `.env.local`: `REPLICATE_API_TOKEN_2=your_key`
- Restart backend server

### Issue: "Styles look broken"
**Solution:**
- Clear Next.js cache: `rm -rf .next`
- Rebuild: `pnpm build`
- Restart dev server: `pnpm dev`

## Next Steps

1. **Customize Colors:**
   - Edit `app/globals.css` to match your brand
   - Update navigation logo in `components/navigation.tsx`

2. **Add More Features:**
   - Create salon profile page (`/create-salon`)
   - Add user profile editing
   - Implement payment integration
   - Add real-time notifications

3. **Deploy:**
   - Frontend: Vercel (free tier available)
   - Backend: Render.com, Railway, or DigitalOcean
   - Database: Firebase (already configured)

## API Testing

Use curl to test endpoints:

```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "John Doe",
    "phone": "+91 9876543210",
    "userType": "customer"
  }'

# Get all salons
curl http://localhost:5000/api/salons

# Create booking
curl -X POST http://localhost:5000/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_id",
    "salonId": "salon_id",
    "appointmentDate": "2024-02-20",
    "appointmentTime": "14:00",
    "notes": "Hair cut"
  }'
```

## Support

For detailed documentation, see `README.md`

Happy coding! 🎉
