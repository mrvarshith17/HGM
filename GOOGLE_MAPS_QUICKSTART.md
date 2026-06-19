# Google Maps Integration - Quick Start

## 🚀 Quick Setup

### 1. Environment Check
Verify `.env.local` has:
```
NEXT_PUBLIC_GCP_API_KEY=your_google_maps_api_key
```

### 2. Use Nearby Salons Widget
Add to your homepage:
```tsx
import NearbySalons from '@/components/nearby-salons'

export default function HomePage() {
  return (
    <main>
      <NearbySalons />
    </main>
  )
}
```

### 3. Use Search with Map
Already integrated in `/app/search/page.tsx`:
- Displays map with all salons
- Shows distance from user location
- Filter by city
- Search by name/service

### 4. Use Location Search
For custom pages:
```tsx
import LocationSearch from '@/components/location-search'

export default function CustomPage() {
  const handleLocationSelect = (location) => {
    console.log('Selected location:', location)
    // Do something with the location
  }

  return <LocationSearch onLocationSelect={handleLocationSelect} />
}
```

## 📍 Components Reference

### SalonsWithMap
Complete salons list with map integration:
```tsx
import SalonsWithMap from '@/components/salons-with-map'

<SalonsWithMap 
  salons={salons}
  showMap={true}
  onlyNearby={false}
/>
```

**Props:**
- `salons`: Array of salon objects with coordinates
- `showMap`: Show/hide map (default: true)
- `onlyNearby`: Only show nearby salons (default: false)

### MapDisplay
Standalone map component:
```tsx
import MapDisplay from '@/components/map-display'

<MapDisplay 
  salons={salons}
  userLocation={userLocation}
  selectedSalonId={selectedId}
  onSalonSelect={handleSelect}
  zoom={15}
  height="500px"
/>
```

**Props:**
- `salons`: Array of salon objects with lat/lng
- `userLocation`: User's current location {latitude, longitude}
- `selectedSalonId`: Highlight specific salon
- `onSalonSelect`: Callback when user clicks salon
- `zoom`: Map zoom level (default: 13)
- `height`: Map container height (default: 500px)

### LocationSearch
Search and select locations:
```tsx
import LocationSearch from '@/components/location-search'

<LocationSearch 
  onLocationSelect={handleSelect}
  placeholder="Search location..."
  showCurrentLocation={true}
/>
```

**Props:**
- `onLocationSelect`: Callback with selected location
- `placeholder`: Input placeholder text
- `className`: Additional CSS classes
- `showCurrentLocation`: Show current location button

### NearbySalons
Complete nearby salons widget:
```tsx
import NearbySalons from '@/components/nearby-salons'

<NearbySalons />
```

No props required - handles everything internally.

## 🔧 Service Functions

### In TypeScript/React Code:

```tsx
import {
  getUserLocation,
  geocodeAddress,
  calculateDistance,
  formatDistance,
  getNearestSalons,
  reverseGeocode
} from '@/lib/google-maps-service'

// Get user's location
const location = await getUserLocation()
console.log(location) // { latitude: 20.5, longitude: 78.9 }

// Get coordinates from address
const coords = await geocodeAddress('123 Main St, Hyderabad')
console.log(coords) // { latitude: 17.36, longitude: 78.47 }

// Calculate distance between two points
const distance = calculateDistance(20.5, 78.9, 17.36, 78.47)
console.log(distance) // kilometers

// Format distance for display
const formatted = formatDistance(2.5)
console.log(formatted) // '2.5km'

// Get nearest salons sorted by distance
const nearest = getNearestSalons(salons, userLat, userLng, 10, 25)

// Reverse geocode coordinates to address
const address = await reverseGeocode(17.36, 78.47)
console.log(address) // 'Street Address, City, Country'
```

## 📡 API Endpoints

### Get Nearby Salons
```bash
GET /api/salons/nearby?latitude=20.5&longitude=78.9&radius=50&limit=20
```

**Response:**
```json
{
  "results": [
    {
      "id": "salon-1",
      "name": "Salon A",
      "address": "123 Main St",
      "latitude": 20.5,
      "longitude": 78.9,
      "distance": 2.5,
      "distanceFormatted": "2.5km",
      "rating": 4.5,
      "phone": "1234567890"
    }
  ],
  "count": 5,
  "userLocation": { "latitude": 20.5, "longitude": 78.9 },
  "radius": 50
}
```

### Get All Salons
```bash
GET /api/salons
```

All salons now include latitude/longitude automatically.

### Create Salon
```bash
POST /api/salons
Content-Type: application/json

{
  "ownerId": "owner-1",
  "name": "Salon Name",
  "address": "123 Main St",
  "city": "Hyderabad",
  "phone": "1234567890",
  "email": "salon@example.com",
  "description": "Description",
  "services": ["Haircut", "Coloring"]
}
```

Address is automatically geocoded and coordinates are stored.

## 🎯 Common Use Cases

### 1. Show Nearest Salons on Home Page
```tsx
<NearbySalons />
```

### 2. Allow User to Search Salons Near Custom Location
```tsx
import LocationSearch from '@/components/location-search'
import SalonsWithMap from '@/components/salons-with-map'

export default function SearchPage() {
  const [salons, setSalons] = useState([])
  const [userLocation, setUserLocation] = useState(null)

  const handleLocationSelect = async (location) => {
    setUserLocation(location)
    const response = await fetch(
      `/api/salons/nearby?latitude=${location.latitude}&longitude=${location.longitude}&radius=50`
    )
    const data = await response.json()
    setSalons(data.results)
  }

  return (
    <div>
      <LocationSearch onLocationSelect={handleLocationSelect} />
      {salons.length > 0 && <SalonsWithMap salons={salons} />}
    </div>
  )
}
```

### 3. Show Map of All Salons
```tsx
import MapDisplay from '@/components/map-display'

export default function MapPage() {
  const [salons, setSalons] = useState([])

  useEffect(() => {
    fetch('/api/salons').then(r => r.json()).then(setSalons)
  }, [])

  return (
    <MapDisplay 
      salons={salons}
      height="100vh"
    />
  )
}
```

### 4. Filter Salons by Distance
```tsx
import { getNearestSalons } from '@/lib/google-maps-service'

const nearest = getNearestSalons(
  salons,
  userLatitude,
  userLongitude,
  limit = 10,      // Get top 10
  radiusKm = 25    // Within 25km
)
```

## ✅ Features Implemented

- [x] Complete map display with markers
- [x] User location detection
- [x] Distance calculation (km/miles)
- [x] Distance-based salon sorting
- [x] Location search (Google Places)
- [x] Current location button
- [x] Nearby salons API
- [x] Auto-geocoding on salon creation
- [x] Auto-geocoding on salon fetch
- [x] Database-backed coordinates
- [x] Responsive design
- [x] Error handling

## 🐛 Troubleshooting

### Map doesn't show
1. Check Google Maps script is loaded: `window.google.maps` should exist
2. Verify API key is correct
3. Check browser console for errors
4. Ensure `height` prop is set on MapDisplay

### No salons found
1. Verify salons have coordinates in database
2. Check if salons are within the search radius
3. Try increasing radius parameter

### Location not detected
1. User may have blocked geolocation permission
2. Page must be HTTPS (except localhost)
3. Check browser console for permission errors

### Distance calculations seem wrong
1. Verify latitude/longitude values
2. Check if using correct units (degrees for lat/lng)
3. Earth's radius is 6371km (hardcoded)

## 📚 Resources

- [Google Maps API Docs](https://developers.google.com/maps)
- [Places API Docs](https://developers.google.com/maps/documentation/places)
- [Geocoding API Docs](https://developers.google.com/maps/documentation/geocoding)
- Full guide: [GOOGLE_MAPS_INTEGRATION.md](./GOOGLE_MAPS_INTEGRATION.md)

## 🔄 Database vs localStorage

### ✅ What uses Database Now
- Salon information
- Salon coordinates
- Salon ratings and reviews
- User bookings
- Location data

### ⚠️ Still Using localStorage (Authentication)
- Auth tokens
- User session
- User type

This can be migrated to a proper auth system (Firebase, NextAuth, etc.) separately.

## 🚀 Next Steps

1. ✅ Add to home page
2. ✅ Update search page
3. ✅ Test with your salons
4. [ ] Add to salon detail page
5. [ ] Add to owner dashboard
6. [ ] Migrate remaining localStorage to database/auth
