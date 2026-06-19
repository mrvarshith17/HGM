# Google Maps API Integration Guide

## Overview

This document describes the complete Google Maps API integration with database connectivity, replacing all localStorage dependencies.

## Features Implemented

### 1. **Complete Map Display**
- Interactive Google Maps showing all salons
- User location marker (blue dot)
- Salon markers (orange dots, red for selected)
- Info windows with salon details
- Map fitBounds to show all locations

### 2. **Distance Calculation & Display**
- Haversine formula for accurate distance calculation
- Distance display in km or meters
- Real-time distance calculation from user location
- Sorting salons by distance

### 3. **Location Search**
- Google Places Autocomplete API integration
- Location search available in:
  - Search page
  - Home/nearby salons widget
  - Salon filters
- Current location detection via Geolocation API

### 4. **Database Integration**
- All salon data stored in database with coordinates
- Automatic geocoding of addresses during salon creation
- API endpoints support coordinate queries
- No dependency on localStorage

## File Structure

### Core Services

#### `lib/google-maps-service.ts`
Main service for all Google Maps operations:
- `geocodeAddress()` - Convert address to coordinates
- `getUserLocation()` - Get user's current location
- `calculateDistance()` - Haversine distance calculation
- `formatDistance()` - Format distance for display
- `calculateSalonDistances()` - Add distances to salons
- `sortSalonsByDistance()` - Sort salons by distance
- `filterSalonsByRadius()` - Filter salons within radius
- `getNearestSalons()` - Get nearby salons
- `reverseGeocode()` - Convert coordinates to address

### Components

#### `components/map-display.tsx`
Interactive map component:
- Displays Google Map with markers
- Shows user location
- Shows salon markers with info windows
- Click handlers for salon selection
- Responsive design

#### `components/salons-with-map.tsx`
Combined salons list and map:
- Maps integration
- Distance sorting
- Salon cards with distance display
- Responsive grid layout
- Loading states

#### `components/location-search.tsx`
Location search component:
- Google Places autocomplete
- Current location button
- Coordinate and address selection
- Debounced input

#### `components/nearby-salons.tsx`
Widget for home page:
- Location search
- Nearby salons display
- Map integration
- Error handling

### API Routes

#### `app/api/salons/nearby/route.ts`
Fetch nearby salons:
```
GET /api/salons/nearby?latitude=20.5&longitude=78.9&radius=50&limit=20
```
Parameters:
- `latitude`: User latitude (required)
- `longitude`: User longitude (required)
- `radius`: Search radius in km (default: 50)
- `limit`: Max results (default: 20)

#### `app/api/salons/route.ts` (Updated)
Enhanced GET and POST handlers:
- Auto-geocoding of addresses
- Coordinate storage
- Distance sorting support

## Setup Instructions

### 1. Environment Variables

Ensure `.env.local` has:
```
NEXT_PUBLIC_GCP_API_KEY=your_google_maps_api_key
```

The API key needs these APIs enabled:
- Maps JavaScript API
- Geocoding API
- Places API

### 2. Layout Configuration

Google Maps script is loaded in `app/layout.tsx`:
```tsx
<script
  src={`https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}`}
  async
  defer
></script>
```

### 3. Database Schema

Salons should have:
```typescript
{
  id: string
  name: string
  address: string
  city: string
  latitude: number      // Added automatically
  longitude: number     // Added automatically
  phone: string
  email: string
  rating: number
  reviewCount: number
  services: string[]
  profilePicture?: string
  // ... other fields
}
```

## Usage Examples

### Display Nearby Salons
```tsx
import NearbySalons from '@/components/nearby-salons'

export default function HomePage() {
  return (
    <div>
      <NearbySalons />
    </div>
  )
}
```

### Display Salons with Map
```tsx
import SalonsWithMap from '@/components/salons-with-map'

export default function SearchPage() {
  const [salons, setSalons] = useState([])

  return (
    <SalonsWithMap 
      salons={salons} 
      showMap={true} 
      onlyNearby={false} 
    />
  )
}
```

### Display Map Only
```tsx
import MapDisplay from '@/components/map-display'

export default function SalonMapPage() {
  return (
    <MapDisplay 
      salons={salons}
      userLocation={userLocation}
      onSalonSelect={handleSelect}
      height="600px"
    />
  )
}
```

### Get Nearest Salons
```tsx
import { getUserLocation, getNearestSalons } from '@/lib/google-maps-service'

const userLocation = await getUserLocation()
const nearest = getNearestSalons(salons, userLocation.latitude, userLocation.longitude, 10, 25)
```

## API Endpoints

### GET /api/salons
Fetch all salons (with auto-geocoding):
```bash
curl http://localhost:3000/api/salons
```

### GET /api/salons/nearby
Fetch nearby salons:
```bash
curl "http://localhost:3000/api/salons/nearby?latitude=20.5&longitude=78.9&radius=50&limit=20"
```

Response:
```json
{
  "results": [
    {
      "id": "salon-1",
      "name": "Salon Name",
      "address": "Address",
      "latitude": 20.5,
      "longitude": 78.9,
      "distance": 2.5,
      "distanceFormatted": "2.5km",
      ...
    }
  ],
  "count": 5,
  "userLocation": { "latitude": 20.5, "longitude": 78.9 },
  "radius": 50
}
```

### POST /api/salons
Create salon (auto-geocoding):
```bash
curl -X POST http://localhost:3000/api/salons \
  -H "Content-Type: application/json" \
  -d '{
    "ownerId": "owner-1",
    "name": "Salon Name",
    "address": "123 Main St",
    "city": "Hyderabad",
    "phone": "1234567890",
    "description": "Description",
    "services": ["Haircut", "Coloring"]
  }'
```

## Database Removal of localStorage

### Before (localStorage)
```tsx
const userData = localStorage.getItem('userData')
const user = JSON.parse(userData)
```

### After (Database)
```tsx
// User data is retrieved from authentication/database
// No localStorage for user data
```

### Pages Updated
- `app/search/page.tsx` - Removed localStorage
- `app/salon/[id]/page.tsx` - Can be updated
- `app/dashboard/` pages - Can be updated

## Geocoding Behavior

### Automatic Geocoding
1. When creating a salon - address is automatically geocoded
2. When fetching salons - missing coordinates are geocoded on demand
3. Results are cached in the database

### Reverse Geocoding
Coordinates can be converted back to addresses:
```tsx
const address = await reverseGeocode(latitude, longitude)
```

## Performance Considerations

### Caching
- Google Maps API responses are cached at the application level
- Geocoding results stored in database to avoid repeated API calls
- Front-end caching of salons data

### Rate Limiting
- Google Maps API has generous free tier
- Implementation includes error handling for rate limits
- Consider upgrading API key if usage exceeds limits

### Optimization
- Salons are pre-geocoded during creation
- Lazy loading of maps on pages
- Debounced search input (300ms)

## Troubleshooting

### Map Not Displaying
1. Check if Google Maps script is loaded
2. Verify API key in environment variables
3. Check browser console for errors

### No Coordinates Found
1. Verify address format
2. Check if Google Maps API key has Geocoding API enabled
3. Address may not exist in Google's database

### Geolocation Not Working
1. User may have blocked location access
2. Page must be served over HTTPS (except localhost)
3. Check browser console for permission errors

### Distance Calculations Wrong
1. Verify latitude/longitude values
2. Check Haversine formula implementation
3. Consider Earth's radius constant

## Migration Checklist

- [x] Create Google Maps service
- [x] Create map display component
- [x] Create salons with map component
- [x] Create location search component
- [x] Update salons API to geocode addresses
- [x] Create nearby salons endpoint
- [x] Update search page to remove localStorage
- [x] Add Google Maps script to layout
- [ ] Update dashboard pages
- [ ] Update salon detail page
- [ ] Update profile pages
- [ ] Remove all localStorage usage
- [ ] Test all features
- [ ] Deploy and monitor

## Support & Resources

- Google Maps API: https://developers.google.com/maps
- Places API: https://developers.google.com/maps/documentation/places
- Geocoding API: https://developers.google.com/maps/documentation/geocoding
- Haversine Formula: https://en.wikipedia.org/wiki/Haversine_formula
