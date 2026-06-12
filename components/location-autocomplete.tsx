'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { MapPin } from 'lucide-react'

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
  name: string
}

interface LocationAutocompleteProps {
  value: string
  onSelect: (details: PlaceDetails & { description: string }) => void
  placeholder?: string
  className?: string
}

export default function LocationAutocomplete({
  value,
  onSelect,
  placeholder = 'Search location...',
  className = '',
}: LocationAutocompleteProps) {
  const [input, setInput] = useState(value)
  const [predictions, setPredictions] = useState<PlacePrediction[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceTimer = useRef<NodeJS.Timeout>()

  // Fetch predictions from API
  const fetchPredictions = useCallback(async (searchInput: string) => {
    if (searchInput.length < 2) {
      setPredictions([])
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/places/autocomplete?input=${encodeURIComponent(searchInput)}`)
      const data = await response.json()
      setPredictions(data.predictions || [])
      setIsOpen(true)
    } catch (error) {
      console.error('Autocomplete error:', error)
      setPredictions([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Debounced input handler
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInput(newValue)

    // Clear previous timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    // Set new timer
    debounceTimer.current = setTimeout(() => {
      fetchPredictions(newValue)
    }, 300)
  }, [fetchPredictions])

  // Fetch details and call onSelect
  const handleSelectPlace = useCallback(async (prediction: PlacePrediction) => {
    try {
      const response = await fetch(`/api/places/details?placeId=${encodeURIComponent(prediction.placeId)}`)
      const details = await response.json()

      if (details.error) {
        console.error('Failed to get place details:', details.error)
        return
      }

      onSelect({
        ...details,
        description: prediction.description,
      })

      setInput(prediction.description)
      setIsOpen(false)
      setPredictions([])
    } catch (error) {
      console.error('Error fetching place details:', error)
    }
  }, [onSelect])

  // Close dropdown when clicking outside
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
      <div className="relative">
        <MapPin className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={handleInputChange}
          onFocus={() => input && predictions.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          className={`w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 ${className}`}
        />
        {isLoading && (
          <div className="absolute right-3 top-3">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-600 border-t-indigo-500" />
          </div>
        )}
      </div>

      {isOpen && predictions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-lg z-50">
          <div className="max-h-96 overflow-y-auto">
            {predictions.map((prediction) => (
              <button
                key={prediction.placeId}
                onClick={() => handleSelectPlace(prediction)}
                className="w-full text-left px-4 py-3 hover:bg-slate-700 flex items-start gap-3 transition"
              >
                <MapPin className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="text-white text-sm font-medium">{prediction.mainText}</div>
                  {prediction.secondaryText && (
                    <div className="text-slate-400 text-xs">{prediction.secondaryText}</div>
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
