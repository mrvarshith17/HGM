'use client'

import { useState, ChangeEvent, FormEvent } from 'react'
import { SmartSearchResponse } from '@/lib/ai-service'
import Link from 'next/link'
import { MapPin, Phone, Star, Scissors } from 'lucide-react'

interface SmartSearchWidgetProps {
  onResultsFound?: (results: SmartSearchResponse) => void
}

export function SmartSearchWidget({ onResultsFound }: SmartSearchWidgetProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SmartSearchResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSearch = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!query.trim()) {
      setError('Please enter a search query')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/ai/smart-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Search failed')
      }

      const data = await response.json()
      setResults(data)
      onResultsFound?.(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      console.error('Search error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full">
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
            placeholder="Search salons naturally... e.g., 'keratin treatment under 2000' or 'bridal makeup near me'"
            className="flex-1 px-4 py-3 rounded-lg border border-slate-600 bg-slate-800 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 transition-colors font-medium whitespace-nowrap"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </form>

      {error && (
        <div className="bg-red-900/30 border border-red-600 rounded-lg p-4 mb-6">
          <p className="text-red-300">⚠️ {error}</p>
        </div>
      )}

      {loading && (
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <div className="animate-pulse space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-slate-700 rounded p-4">
                <div className="h-4 bg-slate-600 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {results && (
        <div className="space-y-4">
          {/* Extracted Filters */}
          {Object.keys(results.extractedFilters).length > 0 && (
            <div className="bg-purple-950/40 rounded-lg p-4 border border-purple-600/30">
              <h4 className="font-semibold text-purple-200 mb-2">🔍 Extracted Filters</h4>
              <div className="flex flex-wrap gap-2">
                {Object.entries(results.extractedFilters).map(([key, value]) => (
                  <span
                    key={key}
                    className="bg-purple-600/40 text-purple-200 px-3 py-1 rounded-full text-sm border border-purple-500/50"
                  >
                    {key}: {String(value)}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Results Count */}
          <div className="bg-indigo-950/40 rounded-lg p-4 border border-indigo-600/30">
            <p className="text-indigo-200">
              Found <span className="font-bold text-white">{results.totalMatched}</span> matching salons
            </p>
          </div>

          {/* Matching Salons - Enhanced Details */}
          {results.matchingSalons.length > 0 ? (
            <div className="space-y-4">
              {results.matchingSalons.map((salon) => (
                <div
                  key={salon.id}
                  className="bg-slate-800 rounded-lg p-6 border border-slate-700 hover:border-indigo-500 transition-all shadow-lg"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h5 className="text-xl font-semibold text-white mb-1">{salon.name}</h5>
                      {salon.reason && (
                        <p className="text-indigo-300 text-sm mb-3">✨ {salon.reason}</p>
                      )}
                    </div>
                    <div className="text-right ml-4">
                      {salon.rating !== undefined && (
                        <div className="flex items-center gap-1 bg-yellow-600/20 px-3 py-1 rounded-full border border-yellow-600/50">
                          <Star className="h-4 w-4 text-yellow-400" fill="currentColor" />
                          <span className="text-yellow-300 font-semibold">{salon.rating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Salon Details Grid */}
                  <div className="space-y-3 mb-4">
                    {salon.price !== undefined && (
                      <div className="flex items-center gap-2 text-slate-300">
                        <span className="text-lg">💰</span>
                        <span>Starting from <span className="text-white font-semibold">₹{salon.price.toLocaleString()}</span></span>
                      </div>
                    )}
                    {salon.address && (
                      <div className="flex items-start gap-2 text-slate-300">
                        <MapPin className="h-5 w-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                        <span>{salon.address}</span>
                      </div>
                    )}
                    {salon.phone && (
                      <div className="flex items-center gap-2 text-slate-300">
                        <Phone className="h-5 w-5 text-indigo-400" />
                        <span>{salon.phone}</span>
                      </div>
                    )}
                    {salon.services && salon.services.length > 0 && (
                      <div className="pt-2">
                        <p className="text-slate-400 text-sm mb-2 flex items-center gap-2">
                          <Scissors className="h-4 w-4" />
                          Services:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {salon.services.slice(0, 5).map((service, idx) => (
                            <span
                              key={idx}
                              className="text-xs bg-indigo-600/30 text-indigo-200 px-2 py-1 rounded border border-indigo-500/50"
                            >
                              {service}
                            </span>
                          ))}
                          {salon.services.length > 5 && (
                            <span className="text-xs text-slate-400">+{salon.services.length - 5} more</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4 border-t border-slate-700">
                    <Link
                      href={`/salon/${salon.id}`}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition-colors text-center"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-slate-800 rounded-lg p-6 text-slate-400 border border-slate-700 text-center">
              No salons found matching your criteria.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
