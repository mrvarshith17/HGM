/**
 * AI Service Layer
 * Handles communication with the Python microservice for AI features
 */

export interface RecommendationsResponse {
  userId: string
  recommendations: Array<{
    salonId: string
    name: string
    matchScore: number
    reason: string
  }>
  basedOnSimilarUsers: number
  timestamp: string
}

export interface SmartSearchResponse {
  query: string
  extractedFilters: Record<string, any>
  matchingSalons: Array<{
    id: string
    name: string
    price?: number
    rating?: number
    reason?: string
    address?: string
    phone?: string
    email?: string
    city?: string
    services?: string[]
    profilePicture?: string
  }>
  totalMatched: number
  timestamp?: string
}

export interface PricingResponse {
  salonId: string
  overallOccupancy: number
  suggestedRevenueIncrease: number
  recommendations: Array<{
    timeSlot: string
    currentOccupancy: number
    suggestedAction: string
    expectedImpact: number
  }>
  timestamp: string
}

const API_URL = process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'http://localhost:8000'

async function callAIService<T>(endpoint: string, data: Record<string, any>): Promise<T> {
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }))
      throw new Error(error.message || `AI Service error: ${response.status}`)
    }

    return response.json()
  } catch (error) {
    console.error(`AI Service error at ${endpoint}:`, error)
    throw error
  }
}

/**
 * Get personalized salon recommendations for a user
 * @param userId - The user ID
 * @param limit - Maximum number of recommendations
 * @returns Recommendations with reasoning
 */
export async function getRecommendations(
  userId: string,
  limit: number = 5
): Promise<RecommendationsResponse> {
  return callAIService<RecommendationsResponse>('/recommendations', {
    userId,
    limit,
  })
}

/**
 * Perform NLP-powered smart search
 * @param query - Natural language search query (e.g., "keratin treatment under 2000")
 * @returns Matching salons with extracted filters
 */
export async function smartSearch(query: string): Promise<SmartSearchResponse> {
  return callAIService<SmartSearchResponse>('/smart-search', {
    query,
  })
}

/**
 * Get dynamic pricing suggestions for a salon
 * @param salonId - The salon ID
 * @returns Pricing recommendations based on occupancy and booking patterns
 */
export async function getPricingSuggestions(salonId: string): Promise<PricingResponse> {
  return callAIService<PricingResponse>('/pricing-suggestions', {
    salonId,
  })
}

/**
 * Health check for AI service
 */
export async function checkAIServiceHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/health`, {
      method: 'GET',
    })
    return response.ok
  } catch {
    return false
  }
}
