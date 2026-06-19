'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import Navigation from '@/components/navigation'
import { Search } from 'lucide-react'
import SalonsWithMap from '@/components/salons-with-map'
import { SmartSearchWidget } from '@/components/smart-search-widget'
import { useAuth } from '@/hooks/useAuth'
import { RecommendationWidget } from '@/components/recommendation-widget'

interface Salon {
  id: string
  ownerId?: string
  name: string
  address: string
  city: string
  rating: number
  reviewCount: number
  services: string[]
  profilePicture?: string
  phone: string
  email: string
  latitude?: number
  longitude?: number
  distanceFormatted?: string
}

export default function SearchPage() {
  const { user } = useAuth()
  const [salons, setSalons] = useState<Salon[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCity, setSelectedCity] = useState('')

  const fetchSalons = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/salons')
      if (response.ok) {
        const data = await response.json()
        setSalons(Array.isArray(data) ? data : [])
      } else {
        console.error('Failed to fetch salons')
      }
    } catch (error) {
      console.error('Error fetching salons:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSalons()
  }, [fetchSalons])

  // Get unique cities
  const cities = useMemo(() => {
    return Array.from(new Set(salons.map((s) => s.city).filter(Boolean)))
  }, [salons])

  // Filter salons based on search query and selected city
  const filteredSalons = useMemo(() => {
    return salons.filter((salon) => {
      const matchesQuery =
        searchQuery === '' ||
        salon.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        salon.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        salon.services.some((service) =>
          service.toLowerCase().includes(searchQuery.toLowerCase())
        )

      const matchesCity = selectedCity === '' || salon.city === selectedCity

      return matchesQuery && matchesCity
    })
  }, [salons, searchQuery, selectedCity])

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Find Your Perfect Salon</h1>
          <p className="text-slate-400">Search and discover salons near you with maps</p>
        </div>

        {/* Recommendations for Logged-in Users */}
        {user && (
          <div className="mb-8 bg-gradient-to-r from-indigo-950 to-purple-950 rounded-lg border border-indigo-500/20 p-6">
            <RecommendationWidget userId={user.uid} limit={3} />
          </div>
        )}

        {/* Search and Filter */}
        <div className="bg-slate-900 rounded-lg border border-slate-700 p-6 mb-8">
          <div className="flex flex-col gap-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-500" />
              <input
                type="text"
                placeholder="Search by salon name, location, or service..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>

            {/* City Filter */}
            {cities.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                <button
                  onClick={() => setSelectedCity('')}
                  className={`px-4 py-2 rounded-lg whitespace-nowrap transition ${
                    selectedCity === ''
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  All Cities
                </button>
                {cities.map((city) => (
                  <button
                    key={city}
                    onClick={() => setSelectedCity(city)}
                    className={`px-4 py-2 rounded-lg whitespace-nowrap transition ${
                      selectedCity === city
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {city}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* AI Smart Search Section */}
        <div className="bg-slate-900 rounded-lg border border-indigo-500/30 p-6 mb-8">
          <h2 className="text-lg font-semibold text-white mb-3">🤖 Try AI-Powered Search</h2>
          <p className="text-slate-400 text-sm mb-4">
            Search naturally: "keratin treatment under 2000" or "bridal makeup near me"
          </p>
          <SmartSearchWidget />
        </div>

        {/* Results Info */}
        <div className="mb-4">
          <p className="text-slate-400">
            Found <span className="text-white font-semibold">{filteredSalons.length}</span> salons
            {selectedCity && <span> in {selectedCity}</span>}
            {searchQuery && <span> matching "{searchQuery}"</span>}
          </p>
        </div>

        {/* Salons with Map */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <SalonsWithMap salons={filteredSalons} showMap={true} onlyNearby={false} />
        )}
      </div>
    </main>
  )
}
