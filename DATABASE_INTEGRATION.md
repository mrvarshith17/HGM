# Database Integration Guide

All application data is now stored in the database (Firestore via MongoDB-compatible adapter). LocalStorage is no longer used for data persistence.

## Database Collections

The application uses the following Firestore collections:

### 1. **users** - User accounts and profiles
- `uid` - User ID (primary key)
- `email` - User email
- `name` - Full name
- `phone` - Phone number
- `userType` - 'customer' or 'salon_owner'
- `profilePicture` - Profile image URL
- `authProvider` - 'firebase' or 'local'
- `passwordHash` - (local auth only)
- `passwordSalt` - (local auth only)
- `createdAt` - Account creation timestamp
- `updatedAt` - Last update timestamp

### 2. **salons** - Salon information
- `id` - Salon ID (primary key)
- `ownerId` - Reference to user (owner)
- `name` - Salon name
- `address` - Full address
- `phone` - Contact phone
- `description` - Salon description
- `city` - City name
- `email` - Contact email
- `rating` - Average rating (0-5)
- `reviewCount` - Number of reviews
- `services` - Array of service names
- `profilePicture` - Salon image URL
- `operatingHours` - Object with day:hours mapping
- `createdAt` - Creation timestamp
- `updatedAt` - Last update timestamp

### 3. **bookings** - Appointment bookings
- `bookingId` - Booking ID (primary key)
- `userId` - Reference to customer
- `salonId` - Reference to salon
- `serviceId` - Primary service ID
- `services` - Array of selected services
- `customerName` - Customer name
- `customerEmail` - Customer email
- `customerPhone` - Customer phone
- `appointmentDate` - Date (YYYY-MM-DD format)
- `appointmentTime` - Time (HH:MM format)
- `notes` - Additional notes
- `status` - 'pending', 'confirmed', 'cancelled', or 'completed'
- `createdAt` - Booking creation timestamp
- `updatedAt` - Last update timestamp

### 4. **reviews** - Customer reviews
- `id` - Review ID (primary key)
- `salonId` - Reference to salon
- `userId` - Reference to reviewer
- `rating` - Rating (1-5)
- `comment` - Review text
- `createdAt` - Creation timestamp

### 5. **favorites** - Bookmarked salons
- `id` - Favorite ID (primary key)
- `userId` - Reference to user
- `salonId` - Reference to salon
- `createdAt` - Creation timestamp

## Frontend Services

### Authentication (useAuth hook)
```typescript
import { useAuth } from '@/hooks/useAuth'

const { user, loading, register, login, logout } = useAuth()

// Register
await register({
  email: 'user@example.com',
  password: 'password123',
  name: 'John Doe',
  phone: '9876543210',
  userType: 'customer'
})

// Login
await login('user@example.com', 'password123')

// Logout
await logout()
```

### User Profile (db-user-service)
```typescript
import { getUserProfile, updateUserProfile, getFavoriteSalons } from '@/lib/db-user-service'

// Get profile
const profile = await getUserProfile(userId)

// Update profile
await updateUserProfile(userId, {
  name: 'Jane Doe',
  phone: '9876543210',
  profilePicture: 'https://...'
})

// Get favorites
const favorites = await getFavoriteSalons(userId)

// Add/Remove favorites
await addFavoriteSalon(userId, salonId)
await removeFavoriteSalon(userId, salonId)
```

### Salon Operations (db-salon-service)
```typescript
import { getSalons, getSalon, createSalon, updateSalon } from '@/lib/db-salon-service'

// Get all salons
const salons = await getSalons()

// Get by owner
const ownerSalons = await getSalons(ownerId)

// Get specific salon
const salon = await getSalon(salonId)

// Create salon
const newSalon = await createSalon({
  ownerId: 'user123',
  name: 'My Salon',
  address: '123 Main St',
  phone: '9876543210',
  description: 'Premium salon services',
  city: 'Hyderabad',
  email: 'salon@example.com',
  services: ['Haircut', 'Coloring', 'Styling']
})

// Update salon
await updateSalon(salonId, {
  services: ['Haircut', 'Coloring', 'Styling', 'Perms']
})
```

### Booking Operations (db-booking-service)
```typescript
import { 
  createBooking, 
  getUserBookings, 
  getSalonBookings,
  updateBookingStatus,
  cancelBooking 
} from '@/lib/db-booking-service'

// Create booking
const booking = await createBooking({
  userId: 'customer123',
  salonId: 'salon456',
  serviceId: 'haircut',
  services: ['Haircut', 'Styling'],
  customerName: 'John Doe',
  customerEmail: 'john@example.com',
  customerPhone: '9876543210',
  appointmentDate: '2024-06-15',
  appointmentTime: '14:30',
  notes: 'Prefer afternoon slots'
})

// Get user's bookings
const myBookings = await getUserBookings(userId)

// Get salon's bookings
const salonBookings = await getSalonBookings(salonId)

// Update booking status
await updateBookingStatus(bookingId, 'completed')

// Cancel booking
await cancelBooking(bookingId)
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/google` - Google authentication
- `POST /api/auth/logout` - Logout user

### Users
- `GET /api/users/:userId` - Get user profile
- `PUT /api/users/:userId` - Update user profile
- `GET /api/users/:userId/favorites` - Get favorite salons
- `POST /api/users/:userId/favorites` - Add favorite salon
- `DELETE /api/users/:userId/favorites/:salonId` - Remove favorite

### Salons
- `GET /api/salons` - Get all salons (or by ownerId query)
- `POST /api/salons` - Create new salon
- `GET /api/salons/:salonId` - Get specific salon
- `PUT /api/salons/:salonId` - Update salon
- `DELETE /api/salons/:salonId` - Delete salon
- `GET /api/salons/:salonId/reviews` - Get salon reviews

### Bookings
- `POST /api/bookings` - Create booking
- `GET /api/bookings/user/:userId` - Get user bookings
- `GET /api/bookings/salon/:salonId` - Get salon bookings
- `GET /api/bookings/:bookingId` - Get specific booking
- `PUT /api/bookings/:bookingId` - Update booking status
- `POST /api/bookings/:bookingId/cancel` - Cancel booking

## Migration from LocalStorage

If you have existing components using localStorage, migrate them as follows:

### Before (localStorage)
```typescript
// Save to localStorage
localStorage.setItem('userData', JSON.stringify(user))

// Read from localStorage
const userData = JSON.parse(localStorage.getItem('userData'))
```

### After (Database)
```typescript
// Import the service
import { getUserProfile } from '@/lib/db-user-service'

// Fetch from database
const userData = await getUserProfile(userId)
```

## Data Persistence

All user data is now persistent in the database:
- ✅ Login credentials stored in database
- ✅ User profiles stored in database
- ✅ Bookings stored in database
- ✅ Salon information stored in database
- ✅ Reviews and ratings stored in database
- ✅ Favorite salons stored in database

LocalStorage is only used as a temporary cache for the current session's auth token.

## Benefits

1. **Data Persistence** - Data survives browser restart
2. **Cross-Device Sync** - Access data from any device
3. **Data Consistency** - Single source of truth
4. **Scalability** - Database handles large datasets
5. **Security** - Sensitive data stored securely
6. **Real-time Updates** - Database webhooks for live updates

## Notes

- All API endpoints require proper authentication
- Timestamps are stored in ISO 8601 format
- Services are stored as array of strings
- Images are stored as URLs in the database
