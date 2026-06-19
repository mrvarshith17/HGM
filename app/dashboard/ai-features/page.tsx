'use client'

import { useState } from 'react'
import { RecommendationWidget } from '@/components/recommendation-widget'
import { SmartSearchWidget } from '@/components/smart-search-widget'
import { PricingInsights } from '@/components/pricing-insights'
import { useAuth } from '@/hooks/useAuth'

export default function AIFeaturesPage() {
  const { user } = useAuth()
  const [selectedSalonId, setSelectedSalonId] = useState<string>('6e4bea40-0c9e-4477-a9cb-e4f5679cf49c')
  const [salonName, setSalonName] = useState('Sample Salon')

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">🤖 AI Features</h1>
          <p className="text-lg text-gray-600">
            Discover intelligent salon recommendations, smart search, and dynamic pricing insights
          </p>
        </div>

        {/* Feature 1: Recommendations */}
        <div className="mb-12">
          <div className="bg-white rounded-lg shadow-md p-6 mb-4">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">🎯</span>
              <h2 className="text-2xl font-bold text-gray-900">Smart Recommendations</h2>
            </div>
            <p className="text-gray-600 mb-6">
              Get personalized salon recommendations based on your booking history and similar user patterns.
            </p>

            {user?.uid ? (
              <RecommendationWidget userId={user.uid} limit={5} />
            ) : (
              <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                <p className="text-blue-700">
                  📋 Sign in to see personalized recommendations for your profile.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Feature 2: Smart Search */}
        <div className="mb-12">
          <div className="bg-white rounded-lg shadow-md p-6 mb-4">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">🔍</span>
              <h2 className="text-2xl font-bold text-gray-900">NLP Smart Search</h2>
            </div>
            <p className="text-gray-600 mb-6">
              Search for salons using natural language. Try queries like:
            </p>
            <ul className="text-gray-600 mb-6 space-y-1">
              <li>• "Keratin treatment under 2000"</li>
              <li>• "Bridal makeup near me"</li>
              <li>• "Hair coloring with free consultation"</li>
              <li>• "Best rated salon for men's haircut"</li>
            </ul>

            <SmartSearchWidget />
          </div>
        </div>

        {/* Feature 3: Pricing Insights */}
        <div className="mb-12">
          <div className="bg-white rounded-lg shadow-md p-6 mb-4">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">💰</span>
              <h2 className="text-2xl font-bold text-gray-900">Dynamic Pricing Insights</h2>
            </div>
            <p className="text-gray-600 mb-6">
              AI-powered analysis of occupancy patterns and pricing recommendations.
            </p>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Salon for Analysis:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={selectedSalonId}
                  onChange={(e) => setSelectedSalonId(e.target.value)}
                  placeholder="Enter salon ID"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <input
                  type="text"
                  value={salonName}
                  onChange={(e) => setSalonName(e.target.value)}
                  placeholder="Enter salon name"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {selectedSalonId && <PricingInsights salonId={selectedSalonId} salonName={salonName} />}
          </div>
        </div>

        {/* Info Card */}
        <div className="bg-indigo-50 rounded-lg p-6 border border-indigo-200">
          <h3 className="text-lg font-semibold text-indigo-900 mb-3">📚 Integration Guide</h3>
          <div className="text-indigo-700 space-y-2 text-sm">
            <p>
              <strong>Component Import:</strong> Import components from `@/components/[widget-name]`
            </p>
            <p>
              <strong>Service Functions:</strong> Use `@/lib/ai-service` for direct API access
            </p>
            <p>
              <strong>API Endpoints:</strong> All features are proxied through `/api/ai/*`
            </p>
            <p>
              <strong>Microservice URL:</strong> {process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'http://localhost:8000'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
