'use client'

import { useEffect, useState } from 'react'
import { getRecommendations, RecommendationsResponse } from '@/lib/ai-service'
import Image from 'next/image'

interface RecommendationWidgetProps {
  userId: string
  limit?: number
}

export function RecommendationWidget({ userId, limit = 5 }: RecommendationWidgetProps) {
  const [recommendations, setRecommendations] = useState<RecommendationsResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchRecommendations() {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch('/api/ai/recommendations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, limit }),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to fetch recommendations')
        }

        const data = await response.json()
        setRecommendations(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
        console.error('Failed to fetch recommendations:', err)
      } finally {
        setLoading(false)
      }
    }

    if (userId) {
      fetchRecommendations()
    }
  }, [userId, limit])

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Recommended Salons for You</h3>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 rounded-lg p-6 border border-red-200">
        <p className="text-red-700">⚠️ Error loading recommendations: {error}</p>
      </div>
    )
  }

  if (!recommendations || recommendations.recommendations.length === 0) {
    return (
      <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
        <p className="text-blue-700">
          ℹ️ No new recommendations at this time. You've already visited most available salons!
        </p>
        <p className="text-blue-600 text-sm mt-2">
          Found {recommendations?.basedOnSimilarUsers || 0} users with similar booking patterns.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">🎯 Recommended Salons for You</h3>
        <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded">
          AI Powered
        </span>
      </div>

      <div className="space-y-3">
        {recommendations.recommendations.map((salon, index) => (
          <div
            key={salon.salonId}
            className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-indigo-600">#{index + 1}</span>
                  <div>
                    <h4 className="font-semibold text-gray-900">{salon.name}</h4>
                    <p className="text-sm text-gray-600 mt-1">{salon.reason}</p>
                  </div>
                </div>
              </div>
              <div className="ml-4 text-right">
                <div className="bg-indigo-100 rounded-full px-3 py-1">
                  <span className="text-sm font-semibold text-indigo-700">
                    {(salon.matchScore * 100).toFixed(0)}% match
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-600 mt-4">
        Based on analysis of {recommendations.basedOnSimilarUsers} users with similar booking patterns
      </p>
    </div>
  )
}
