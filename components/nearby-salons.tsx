'use client'

import { useState, useEffect, useCallback } from 'react'
import { AlertCircle, MapPin } from 'lucide-react'
import Link from 'next/link'
import SalonsWithMap from './salons-with-map'
import LocationSearch from './location-search'
import { getUserLocation, Coordinates, SalonWithDistance } from '@/lib/google-maps-service'

export default function NearbySalons() {
  const [userLocation, setUserLocation] = useState<(Coordinates & { address: string }) | null>(null)
  const [salons, setSalons] = useState<SalonWithDistance[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')

  // Fetch nearby salons
  const fetchNearbySalons = useCallback(async (location: Coordinates) => {
    try {
      setLoading(true)
      setError('')
      const response = await fetch(
        `/api/salons/nearby?latitude=${location.latitude}&longitude=${location.longitude}&radius=50&limit=20`
      )

      if (response.ok) {
        const data = await response.json()
        setSalons(data.results || [])
      } else {
        setError('Failed to fetch nearby salons')
      }
    } catch (err) {
      console.error('Error fetching nearby salons:', err)
      setError('Failed to fetch nearby salons')
    } finally {
      setLoading(false)
    }
  }, [])

  // Get user location on mount
  useEffect(() => {
    const getInitialLocation = async () => {
      try {
        const location = await getUserLocation()
        if (location) {
          setUserLocation({
            ...location,
            address: 'Your Location',
          })
          await fetchNearbySalons(location)
        }
      } catch (err) {
        console.error('Error getting location:', err)
        setError('Please enable geolocation to see nearby salons')
      }
    }

    getInitialLocation()
  }, [fetchNearbySalons])

  const handleLocationSelect = useCallback(
    async (location: Coordinates & { address: string }) => {
      setUserLocation(location)
      await fetchNearbySalons(location)
    },
    [fetchNearbySalons]
  )

  return (
    <div className="space-y-6">
      {/* Location Search */}
      <div className="bg-gradient-to-r from-indigo-900/20 to-purple-900/20 rounded-lg border border-indigo-700/50 p-6">
        <h2 className="text-2xl font-bold text-white mb-4">Find Salons Near You</h2>
        <LocationSearch
          onLocationSelect={handleLocationSelect}
          placeholder="Search or use your location..."
          showCurrentLocation={true}
        />
      </div>

      {/* Salons Display */}
      {error && !loading && (
        <div className="bg-red-900/20 border border-red-700 text-red-200 px-4 py-3 rounded-lg flex items-start gap-3">
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className="mt-4 text-slate-400">Loading nearby salons...</p>
          </div>
        </div>
      ) : salons.length === 0 ? (
        <div className="text-center py-12 bg-slate-900 rounded-lg border border-slate-700">
          <MapPin className="h-12 w-12 text-slate-500 mx-auto mb-4" />
          <p className="text-slate-400 text-lg">No salons found nearby</p>
          <p className="text-slate-500 text-sm mt-2">Try expanding your search radius or location</p>
          <Link href="/search">
            <button className="mt-4 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition">
              Browse All Salons
            </button>
          </Link>
        </div>
      ) : (
        <div>
          <div className="mb-4">
            <p className="text-slate-400">
              Found <span className="text-white font-semibold">{salons.length}</span> salons near{' '}
              <span className="text-white font-semibold">{userLocation?.address}</span>
            </p>
          </div>
          <SalonsWithMap salons={salons} showMap={true} onlyNearby={false} />
        </div>
      )}
    </div>
  )
}
