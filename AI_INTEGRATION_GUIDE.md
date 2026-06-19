# AI Features Integration Guide

## Quick Setup

### 1. Update .env.local

```env
# Add this to your .env.local file
NEXT_PUBLIC_AI_SERVICE_URL=http://localhost:8000
```

### 2. Deploy New main.py

Replace or backup your current `ai-microservice/main.py`:

```bash
cd ai-microservice
# Backup current
cp main.py main_backup.py
# Copy new version
cp main_updated.py main.py
# Restart server
uvicorn main:app --reload --port 8000
```

### 3. Install Python Dependencies

```bash
pip install fastapi uvicorn cors pydantic scikit-learn pandas
```

---

## Feature 1: Smart Recommendations

### Backend Call

```typescript
// app/lib/ai-service.ts
export async function getRecommendations(userId: string, limit: number = 5) {
  const response = await fetch('/api/ai/recommendations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, limit }),
  })
  return response.json()
}
```

### React Component Example

```typescript
// app/components/recommendation-widget.tsx
'use client'
import { useEffect, useState } from 'react'
import { getRecommendations } from '@/lib/ai-service'

export function RecommendationWidget({ userId }: { userId: string }) {
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await getRecommendations(userId, 5)
        setRecommendations(data.recommendations || [])
      } catch (error) {
        console.error('Failed to fetch recommendations:', error)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [userId])

  if (loading) return <div>Loading recommendations...</div>

  return (
    <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
      <h2 className="text-2xl font-bold mb-4">🎯 Recommended for You</h2>
      <div className="space-y-3">
        {recommendations.map((salon: any) => (
          <div key={salon.salonId} className="p-4 bg-white rounded-lg border border-blue-200">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-lg">{salon.salonName}</h3>
                <p className="text-sm text-gray-600">{salon.location}</p>
                <p className="text-xs text-gray-500 mt-1">{salon.reason}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-yellow-500">{salon.predictedRating}★</div>
                <p className="text-xs text-gray-600">{salon.similarUsersCount} users</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

### Where to Use
- Homepage dashboard (show top 3 recommendations)
- Search results page (show "You might like these")
- After booking confirmation (show "Similar salons")

---

## Feature 2: NLP Smart Search Chatbot

### Backend Call

```typescript
// app/lib/ai-service.ts (add to existing file)
export async function smartSearch(query: string) {
  const response = await fetch('/api/ai/smart-search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  })
  return response.json()
}
```

### React Component Example

```typescript
// app/components/smart-search-bar.tsx
'use client'
import { useState } from 'react'
import { smartSearch } from '@/lib/ai-service'
import { Sparkles } from 'lucide-react'

export function SmartSearchBar() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [filters, setFilters] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    setLoading(true)
    try {
      const data = await smartSearch(query)
      setResults(data.matchingSalons || [])
      setFilters(data.extractedFilters)
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full">
      <form onSubmit={handleSearch} className="relative">
        <div className="relative">
          <Sparkles className="absolute left-3 top-3 w-5 h-5 text-purple-500" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='Try: "Keratin treatment in Gachibowli under ₹2000, 4+ stars"'
            className="w-full pl-10 pr-4 py-3 border-2 border-purple-300 rounded-lg focus:outline-none focus:border-purple-500"
          />
          <button
            type="submit"
            className="absolute right-2 top-2 px-4 py-1 bg-purple-600 text-white rounded hover:bg-purple-700"
          >
            Search
          </button>
        </div>
      </form>

      {/* Show extracted filters */}
      {filters && (
        <div className="mt-2 p-2 bg-purple-50 rounded text-sm">
          <p className="font-semibold">🔍 Understood:</p>
          <ul className="text-gray-700">
            {filters.location && <li>📍 Location: {filters.location}</li>}
            {filters.services?.length > 0 && <li>✂️ Services: {filters.services.join(', ')}</li>}
            {filters.max_price && <li>💰 Budget: ₹{filters.max_price}</li>}
            {filters.min_rating > 0 && <li>⭐ Rating: {filters.min_rating}+</li>}
          </ul>
        </div>
      )}

      {/* Show results */}
      {results.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="font-semibold">Found {results.length} salons</p>
          {results.map((salon: any) => (
            <div key={salon.id} className="p-3 border rounded hover:bg-gray-50">
              <p className="font-semibold">{salon.name}</p>
              <p className="text-sm text-gray-600">{salon.city}</p>
            </div>
          ))}
        </div>
      )}

      {loading && <p className="mt-2 text-gray-500">Searching...</p>}
    </div>
  )
}
```

### Where to Use
- Replace or enhance search page (`/search`)
- Add to navbar as global search
- Show on homepage as featured search bar

---

## Feature 3: Dynamic Pricing Suggestions

### Backend Call

```typescript
// app/lib/ai-service.ts (add to existing file)
export async function getPricingSuggestions(salonId: string) {
  const response = await fetch('/api/ai/pricing-suggestions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ salonId }),
  })
  return response.json()
}
```

### React Component Example

```typescript
// app/components/pricing-insights.tsx
'use client'
import { useEffect, useState } from 'react'
import { getPricingSuggestions } from '@/lib/ai-service'
import { TrendingUp } from 'lucide-react'

export function PricingInsights({ salonId }: { salonId: string }) {
  const [suggestions, setSuggestions] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await getPricingSuggestions(salonId)
        setSuggestions(data)
      } catch (error) {
        console.error('Failed to fetch pricing:', error)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [salonId])

  if (loading) return <div>Analyzing pricing data...</div>
  if (!suggestions) return null

  return (
    <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-2 border-green-200">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-6 h-6 text-green-600" />
        <h2 className="text-2xl font-bold">💡 Pricing Intelligence</h2>
      </div>

      <div className="mb-4">
        <p className="text-sm text-gray-600">Overall Occupancy Rate</p>
        <div className="mt-1 flex items-center gap-3">
          <div className="flex-1 bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-600 h-2 rounded-full"
              style={{ width: `${suggestions.overallOccupancy}%` }}
            />
          </div>
          <span className="font-bold">{suggestions.overallOccupancy}%</span>
        </div>
      </div>

      <div className="bg-white p-3 rounded-lg mb-4">
        <p className="font-semibold text-green-700">📈 {suggestions.estimatedRevenueIncrease}</p>
        <p className="text-xs text-gray-600">By implementing smart discounts</p>
      </div>

      <div className="space-y-2">
        <h3 className="font-semibold text-sm">Hourly Recommendations</h3>
        {suggestions.suggestions?.slice(0, 5).map((s: any, i: number) => (
          <div key={i} className="p-2 bg-white rounded border-l-4 border-green-400">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-semibold">{s.day} {s.hour}</p>
                <p className="text-xs text-gray-600">{s.bookings} bookings • {s.occupancy}% occupied</p>
              </div>
              {s.recommended_discount !== '0%' && (
                <div className="text-right">
                  <p className="font-bold text-red-600">{s.recommended_discount} OFF</p>
                  <p className="text-xs text-gray-600">Suggested</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

### Where to Use
- Owner dashboard (new "Pricing Intelligence" section)
- Analytics page
- Salon settings page
- Email weekly report to owners

---

## Integration Service (lib/ai-service.ts)

```typescript
// app/lib/ai-service.ts - Complete service file
const API_BASE = '/api/ai'

export interface Recommendation {
  salonId: string
  salonName: string
  predictedRating: number
  similarUsersCount: number
  location: string
  reason: string
}

export interface SearchResult {
  extractedFilters: {
    location: string | null
    services: string[]
    max_price: number | null
    min_rating: number
  }
  matchingSalons: any[]
  totalMatched: number
}

export interface PricingSuggestion {
  salonId: string
  overallOccupancy: number
  suggestions: Array<{
    day: string
    hour: string
    bookings: number
    occupancy: number
    recommended_discount: string
  }>
  estimatedRevenueIncrease: string
}

export async function getRecommendations(
  userId: string,
  limit: number = 5
): Promise<{ recommendations: Recommendation[] }> {
  const response = await fetch(`${API_BASE}/recommendations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, limit }),
  })
  if (!response.ok) throw new Error('Failed to fetch recommendations')
  return response.json()
}

export async function smartSearch(query: string): Promise<SearchResult> {
  const response = await fetch(`${API_BASE}/smart-search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  })
  if (!response.ok) throw new Error('Failed to search')
  return response.json()
}

export async function getPricingSuggestions(
  salonId: string
): Promise<PricingSuggestion> {
  const response = await fetch(`${API_BASE}/pricing-suggestions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ salonId }),
  })
  if (!response.ok) throw new Error('Failed to fetch pricing')
  return response.json()
}
```

---

## Testing the Features

### Test Recommendations
```bash
curl -X POST http://localhost:8000/recommendations \
  -H "Content-Type: application/json" \
  -d '{"userId": "3addea36-323c-46d7-a994-9431b9679fa6", "limit": 5}'
```

### Test Smart Search
```bash
curl -X POST http://localhost:8000/smart-search \
  -H "Content-Type: application/json" \
  -d '{"query": "Find me keratin treatment in Gachibowli under 2000 with 4+ stars"}'
```

### Test Pricing Suggestions
```bash
curl -X POST http://localhost:8000/pricing-suggestions \
  -H "Content-Type: application/json" \
  -d '{"salonId": "6e4bea40-0c9e-4477-a9cb-e4f5679cf49c"}'
```

---

## Deployment Checklist

- [ ] Update `main.py` in `ai-microservice`
- [ ] Add `.env.local` with `NEXT_PUBLIC_AI_SERVICE_URL`
- [ ] Create API routes in Next.js
- [ ] Create service layer (`lib/ai-service.ts`)
- [ ] Add React components
- [ ] Test all endpoints
- [ ] Monitor Python service logs
- [ ] Add error handling for frontend

---

## Troubleshooting

### "Cannot reach AI service"
- Verify Python microservice is running on port 8000
- Check `NEXT_PUBLIC_AI_SERVICE_URL` in `.env.local`
- Check CORS headers

### "No recommendations found"
- Ensure data files exist: `data/bookings.json`, `data/reviews.json`, `data/salons.json`
- Check if test user has booking history

### "Search returns no results"
- Verify salon names and services match in `data/salons.json`
- Check city names are spelled correctly

---

## Next Steps

1. **Phase 1** (This week): Deploy recommendations
2. **Phase 2** (Next week): Add smart search UI
3. **Phase 3** (Following week): Add pricing dashboard for owners
4. **Phase 4** (Future): Add ML model training pipeline
