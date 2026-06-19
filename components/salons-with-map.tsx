'use client'

import { useState, useEffect, useCallback } from 'react'
import { MapPin, Star, Phone, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import MapDisplay from './map-display'
import { getUserLocation, Coordinates, SalonWithDistance } from '@/lib/google-maps-service'

interface SalonsWithMapProps {
  salons: SalonWithDistance[]
  showMap?: boolean
  onlyNearby?: boolean
}

export default function SalonsWithMap({
  salons: initialSalons,
  showMap = true,
  onlyNearby = false,
}: SalonsWithMapProps) {
  const [salons, setSalons] = useState<SalonWithDistance[]>(initialSalons)
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null)
  const [loading, setLoading] = useState(onlyNearby)
  const [selectedSalonId, setSelectedSalonId] = useState<string>('')
  const [error, setError] = useState<string>('')

  // Get user location on mount
  useEffect(() => {
    const getLocation = async () => {
      try {
        const location = await getUserLocation()
        if (location) {
          setUserLocation(location)

          // Fetch nearby salons if onlyNearby is true
          if (onlyNearby) {
            const response = await fetch(
              `/api/salons/nearby?latitude=${location.latitude}&longitude=${location.longitude}&radius=50&limit=20`
            )
            if (response.ok) {
              const data = await response.json()
              setSalons(data.results || [])
            } else {
              setError('Failed to fetch nearby salons')
            }
          } else {
            // Calculate distances for all salons
            const salonsWithDistance = initialSalons.map((salon) => {
              const dLat = ((salon.latitude - location.latitude) * Math.PI) / 180
              const dLon = ((salon.longitude - location.longitude) * Math.PI) / 180
              const a =
                Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos((location.latitude * Math.PI) / 180) *
                  Math.cos((salon.latitude * Math.PI) / 180) *
                  Math.sin(dLon / 2) *
                  Math.sin(dLon / 2)
              const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
              const distance = 6371 * c

              return {
                ...salon,
                distance,
                distanceFormatted:
                  distance < 1
                    ? `${Math.round(distance * 1000)}m`
                    : `${distance.toFixed(1)}km`,
              }
            })

            setSalons(salonsWithDistance.sort((a, b) => (a.distance || 0) - (b.distance || 0)))
          }
        } else {
          setError('Unable to get your location. Please enable geolocation.')
        }
      } catch (err) {
        console.error('Location error:', err)
        setError('Failed to get your location')
      } finally {
        setLoading(false)
      }
    }

    getLocation()
  }, [initialSalons, onlyNearby])

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-slate-400">Getting your location...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-900/20 border border-red-700 text-red-200 px-4 py-3 rounded-lg flex items-start gap-3">
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {showMap && userLocation && salons.length > 0 && (
        <div className="bg-slate-900 rounded-lg border border-slate-700 overflow-hidden">
          <MapDisplay
            salons={salons}
            userLocation={userLocation}
            selectedSalonId={selectedSalonId}
            onSalonSelect={setSelectedSalonId}
            height="400px"
          />
        </div>
      )}

      {salons.length === 0 ? (
        <div className="text-center py-12 bg-slate-900 rounded-lg border border-slate-700">
          <MapPin className="h-12 w-12 text-slate-500 mx-auto mb-4" />
          <p className="text-slate-400 text-lg">No salons found</p>
          {onlyNearby && <p className="text-slate-500 text-sm mt-2">Try expanding your search radius</p>}
        </div>
      ) : (
        <div className="grid gap-4">
          {salons.map((salon) => (
            <Link key={salon.id} href={`/salon/${salon.id}`}>
              <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 hover:border-indigo-500 transition cursor-pointer group">
                <div className="flex items-start gap-4">
                  {salon.profilePicture && (
                    <img
                      src={salon.profilePicture}
                      alt={salon.name}
                      className="h-24 w-24 object-cover rounded-lg flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white text-lg group-hover:text-indigo-400 transition">
                      {salon.name}
                    </h3>

                    <div className="flex items-center gap-2 text-slate-300 text-sm mt-1">
                      <MapPin className="h-4 w-4 flex-shrink-0 text-slate-500" />
                      <span className="truncate">{salon.address}</span>
                    </div>

                    {salon.distanceFormatted && (
                      <div className="text-sm text-indigo-400 mt-1">
                        📍 {salon.distanceFormatted} away
                      </div>
                    )}

                    <div className="flex items-center gap-4 mt-3 text-sm">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        <span className="text-slate-300">
                          {salon.rating.toFixed(1)} ({salon.reviewCount} reviews)
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Phone className="h-4 w-4 text-slate-500" />
                        <span className="text-slate-400">{salon.phone}</span>
                      </div>
                    </div>

                    {salon.services && salon.services.length > 0 && (
                      <div className="flex gap-2 mt-3 flex-wrap">
                        {salon.services.slice(0, 3).map((service, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-indigo-900/30 text-indigo-300 rounded text-xs"
                          >
                            {service}
                          </span>
                        ))}
                        {salon.services.length > 3 && (
                          <span className="px-2 py-1 bg-slate-700 text-slate-300 rounded text-xs">
                            +{salon.services.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
