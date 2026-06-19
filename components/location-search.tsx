'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { MapPin } from 'lucide-react'
import { getUserLocation, Coordinates } from '@/lib/google-maps-service'

interface LocationSearchProps {
  onLocationSelect: (location: Coordinates & { address: string }) => void
  placeholder?: string
  className?: string
  showCurrentLocation?: boolean
}

interface PlacePrediction {
  placeId: string
  description: string
  mainText: string
  secondaryText?: string
}

interface PlaceDetails {
  address: string
  latitude: number
  longitude: number
}

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GCP_API_KEY

export default function LocationSearch({
  onLocationSelect,
  placeholder = 'Enter your location...',
  className = '',
  showCurrentLocation = true,
}: LocationSearchProps) {
  const [input, setInput] = useState('')
  const [predictions, setPredictions] = useState<PlacePrediction[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceTimer = useRef<NodeJS.Timeout>()

  // Fetch predictions from Google Places API
  const fetchPredictions = useCallback(async (searchInput: string) => {
    if (searchInput.length < 2) {
      setPredictions([])
      return
    }

    if (!GOOGLE_MAPS_API_KEY) {
      console.error('Google Maps API key not configured')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/places/autocomplete?input=${encodeURIComponent(searchInput)}`)
      if (response.ok) {
        const data = await response.json()
        setPredictions(data.predictions || [])
        setIsOpen(true)
      }
    } catch (error) {
      console.error('Autocomplete error:', error)
      setPredictions([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Debounced input handler
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value
      setInput(newValue)

      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }

      debounceTimer.current = setTimeout(() => {
        fetchPredictions(newValue)
      }, 300)
    },
    [fetchPredictions]
  )

  // Fetch place details and select location
  const handleSelectPlace = useCallback(
    async (prediction: PlacePrediction) => {
      try {
        const response = await fetch(
          `/api/places/details?placeId=${encodeURIComponent(prediction.placeId)}`
        )
        if (response.ok) {
          const details: PlaceDetails = await response.json()
          onLocationSelect({
            latitude: details.latitude,
            longitude: details.longitude,
            address: prediction.description,
          })
          setInput(prediction.description)
          setIsOpen(false)
          setPredictions([])
        }
      } catch (error) {
        console.error('Error fetching place details:', error)
      }
    },
    [onLocationSelect]
  )

  // Get user's current location
  const handleCurrentLocation = useCallback(async () => {
    setIsGettingLocation(true)
    try {
      const location = await getUserLocation()
      if (location) {
        // Reverse geocode to get address
        try {
          const response = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${location.latitude},${location.longitude}&key=${GOOGLE_MAPS_API_KEY}`
          )
          if (response.ok) {
            const data = await response.json()
            const address = data.results?.[0]?.formatted_address || `${location.latitude}, ${location.longitude}`
            onLocationSelect({
              ...location,
              address,
            })
            setInput(address)
          } else {
            onLocationSelect({
              ...location,
              address: `${location.latitude}, ${location.longitude}`,
            })
          }
        } catch (error) {
          console.error('Reverse geocoding error:', error)
          onLocationSelect({
            ...location,
            address: `${location.latitude}, ${location.longitude}`,
          })
        }
      }
    } catch (error) {
      console.error('Location error:', error)
    } finally {
      setIsGettingLocation(false)
    }
  }, [onLocationSelect])

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative">
      <div className="relative flex items-center">
        <MapPin className="absolute left-3 h-5 w-5 text-slate-400 flex-shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={handleInputChange}
          onFocus={() => input && predictions.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          className={`w-full pl-10 pr-12 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 ${className}`}
        />
        {showCurrentLocation && (
          <button
            onClick={handleCurrentLocation}
            disabled={isGettingLocation}
            className="absolute right-3 p-1.5 text-slate-400 hover:text-indigo-400 transition disabled:opacity-50"
            title="Use current location"
          >
            {isGettingLocation ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-600 border-t-indigo-500" />
            ) : (
              <MapPin className="h-5 w-5" />
            )}
          </button>
        )}
      </div>

      {isOpen && predictions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-lg z-50">
          <div className="max-h-96 overflow-y-auto">
            {predictions.map((prediction) => (
              <button
                key={prediction.placeId}
                onClick={() => handleSelectPlace(prediction)}
                className="w-full text-left px-4 py-3 hover:bg-slate-700 flex items-start gap-3 transition border-b border-slate-700 last:border-b-0"
              >
                <MapPin className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-white text-sm font-medium truncate">
                    {prediction.mainText}
                  </div>
                  {prediction.secondaryText && (
                    <div className="text-slate-400 text-xs truncate">
                      {prediction.secondaryText}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
