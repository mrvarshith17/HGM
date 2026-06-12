'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import Navigation from '@/components/navigation'
import { MapPin, Star, Search } from 'lucide-react'
import { getSalonCity } from '@/lib/location'
import { getStarStates } from '@/lib/rating-utils'

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
}

export default function SearchPage() {
  const [salons, setSalons] = useState<Salon[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCity, setSelectedCity] = useState('')
  const [userOwnerId, setUserOwnerId] = useState<string | null>(null)
  const [isOwner, setIsOwner] = useState(false)

  const fetchSalons = useCallback(async () => {
    try {
      setLoading(true)
      const userData = localStorage.getItem('userData')
      
      if (userData) {
        try {
          const user = JSON.parse(userData)
          setUserOwnerId(user.uid)
          setIsOwner(user.userType === 'salon_owner')
        } catch (error) {
          console.error('Failed to parse user data:', error)
        }
      }

      const response = await fetch('/api/salons')
      if (response.ok) {
        const data = await response.json()
        setSalons(data)
      }
    } catch (error) {
      console.error('Failed to fetch salons:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSalons()
  }, [fetchSalons])

  useEffect(() => {
    const handleReviewSubmitted = () => {
      console.log('Review submitted event received, refreshing salons...')
      fetchSalons()
    }
    
    window.addEventListener('salonReviewSubmitted', handleReviewSubmitted)
    return () => window.removeEventListener('salonReviewSubmitted', handleReviewSubmitted)
  }, [fetchSalons])

  const filteredSalons = useMemo(() => {
    let filtered = salons

    // If user is salon owner, show only their salons
    if (isOwner && userOwnerId) {
      filtered = filtered.filter(salon => salon.ownerId === userOwnerId)
    }

    if (searchQuery) {
      filtered = filtered.filter(salon =>
        salon.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        salon.address.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (selectedCity) {
      filtered = filtered.filter(salon => getSalonCity(salon) === selectedCity)
    }

    return filtered
  }, [searchQuery, selectedCity, salons, isOwner, userOwnerId])

  const cities = useMemo(() => (
    Array
      .from(new Set(salons.map((salon) => getSalonCity(salon)).filter(Boolean)))
      .sort((a, b) => a.localeCompare(b))
  ), [salons])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900">
      <Navigation />

      <section className="px-6 py-12">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-4xl font-bold text-white mb-8">Find Your Perfect Salon</h1>

          {/* Search and Filters */}
          <div className="mb-12 space-y-4 lg:flex lg:gap-4 lg:space-y-0">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search salons..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-lg border border-slate-700 bg-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="px-4 py-3 rounded-lg border border-slate-700 bg-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Cities</option>
              {cities.map(city => (
                <option key={city} value={city} className="bg-slate-800 text-white">{city}</option>
              ))}
            </select>
          </div>

          {/* Salons Grid */}
          {loading ? (
            <div className="text-center py-12">
              <p className="text-slate-400">Loading salons...</p>
            </div>
          ) : filteredSalons.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-400">No salons found. Try a different search.</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredSalons.map((salon) => (
                <Link key={salon.id} href={`/salon/${salon.id}`}>
                  <div className="group rounded-lg border border-slate-800 bg-slate-900/50 backdrop-blur overflow-hidden hover:border-indigo-500 transition cursor-pointer">
                    <div className="h-48 bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
                      {salon.profilePicture ? (
                        <img src={salon.profilePicture} alt={salon.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-white text-4xl font-bold opacity-50">✂️</div>
                      )}
                    </div>

                    <div className="p-6">
                      <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-indigo-400 transition">{salon.name}</h3>

                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex items-center gap-1">
                          {getStarStates(salon.rating).map((state, i) => (
                            <div key={i} className="relative h-4 w-4">
                              <Star className="h-4 w-4 text-slate-600" />
                              {(state === 'full' || state === 'half') && (
                                <div className="absolute top-0 left-0 h-4 overflow-hidden" style={{ width: state === 'full' ? '100%' : '50%' }}>
                                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                        <span className="text-sm text-slate-400">({salon.reviewCount} reviews)</span>
                      </div>

                      <div className="flex items-start gap-2 mb-4 text-sm text-slate-400">
                        <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
                        <span>{salon.address}</span>
                      </div>

                      <div className="mb-4">
                        <p className="text-xs text-slate-500 mb-2">Services</p>
                        <div className="flex flex-wrap gap-2">
                          {salon.services.slice(0, 3).map((service, idx) => (
                            <span key={idx} className="inline-block px-2 py-1 bg-indigo-600/20 text-indigo-300 rounded text-xs">
                              {service}
                            </span>
                          ))}
                          {salon.services.length > 3 && (
                            <span className="text-xs text-slate-500">+{salon.services.length - 3} more</span>
                          )}
                        </div>
                      </div>

                      <Button className="w-full bg-indigo-600 hover:bg-indigo-700 h-10">
                        View Details
                      </Button>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
