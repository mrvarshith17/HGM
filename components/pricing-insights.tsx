'use client'

import { useEffect, useState } from 'react'
import { PricingResponse } from '@/lib/ai-service'

interface PricingInsightsProps {
  salonId: string
  salonName?: string
}

export function PricingInsights({ salonId, salonName }: PricingInsightsProps) {
  const [pricing, setPricing] = useState<PricingResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchPricing() {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch('/api/ai/pricing-suggestions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ salonId }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to fetch pricing data')
        }

        const data = await response.json()
        setPricing(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
        console.error('Pricing fetch error:', err)
      } finally {
        setLoading(false)
      }
    }

    if (salonId) {
      fetchPricing()
    }
  }, [salonId])

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Pricing Insights</h3>
        <div className="space-y-3 animate-pulse">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded p-4">
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
        <p className="text-red-700">⚠️ Error loading pricing insights: {error}</p>
      </div>
    )
  }

  if (!pricing) {
    return null
  }

  const getActionColor = (action: string) => {
    if (action.includes('discount')) return 'bg-orange-100 text-orange-700'
    if (action.includes('increase')) return 'bg-green-100 text-green-700'
    if (action.includes('maintain')) return 'bg-blue-100 text-blue-700'
    return 'bg-gray-100 text-gray-700'
  }

  const getOccupancyColor = (occupancy: number) => {
    if (occupancy >= 80) return 'bg-green-500'
    if (occupancy >= 60) return 'bg-yellow-500'
    return 'bg-orange-500'
  }

  return (
    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold">💡 Pricing Insights</h3>
          {salonName && <p className="text-sm text-gray-600 mt-1">{salonName}</p>}
        </div>
        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
          AI Analyzed
        </span>
      </div>

      {/* Overall Metrics */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <p className="text-sm text-gray-600 mb-1">Overall Occupancy</p>
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full ${getOccupancyColor(pricing.overallOccupancy)}`}
                style={{ width: `${pricing.overallOccupancy}%` }}
              ></div>
            </div>
            <span className="text-lg font-bold text-gray-900">{pricing.overallOccupancy}%</span>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm">
          <p className="text-sm text-gray-600 mb-1">Revenue Potential</p>
          <p className="text-2xl font-bold text-green-600">
            +₹{(pricing.suggestedRevenueIncrease / 1000).toFixed(0)}k
          </p>
        </div>
      </div>

      {/* Time-based Recommendations */}
      <div className="space-y-3">
        <h4 className="font-semibold text-gray-900">Time-based Recommendations</h4>
        {pricing.recommendations.map((rec, index) => (
          <div key={index} className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h5 className="font-semibold text-gray-900">{rec.timeSlot}</h5>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-gray-600">Occupancy:</span>
                  <span className={`text-sm font-semibold ${rec.currentOccupancy >= 80 ? 'text-green-600' : rec.currentOccupancy >= 60 ? 'text-yellow-600' : 'text-orange-600'}`}>
                    {rec.currentOccupancy}%
                  </span>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getActionColor(rec.suggestedAction)}`}>
                {rec.suggestedAction}
              </span>
            </div>
            <p className="text-sm text-gray-700">
              💰 Expected Impact: <span className="font-semibold">₹{rec.expectedImpact.toLocaleString()}</span>
            </p>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-600">
          Last updated: {new Date(pricing.timestamp).toLocaleString()}
        </p>
      </div>
    </div>
  )
}
