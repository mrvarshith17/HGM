/**
 * Calculates average rating with custom rounding rules
 * - If decimal < 0.3: round down to integer
 * - If 0.3 <= decimal < 0.7: round to nearest 0.5 (integer + 0.5)
 * - If decimal >= 0.7: round up to next integer
 */
export function roundRating(average: number): number {
  if (average === 0) return 0

  const integer = Math.floor(average)
  const decimal = average - integer

  if (decimal < 0.3) {
    return integer
  } else if (decimal < 0.7) {
    return integer + 0.5
  } else {
    return integer + 1
  }
}

/**
 * Renders star rating with support for half stars
 * Returns an array of star states: 'full', 'half', or 'empty'
 */
export function getStarStates(rating: number): ('full' | 'half' | 'empty')[] {
  const states: ('full' | 'half' | 'empty')[] = []
  const fullStars = Math.floor(rating)
  const hasHalfStar = rating % 1 !== 0

  for (let i = 0; i < 5; i++) {
    if (i < fullStars) {
      states.push('full')
    } else if (i === fullStars && hasHalfStar) {
      states.push('half')
    } else {
      states.push('empty')
    }
  }

  return states
}

/**
 * Calculates the average rating from an array of ratings
 */
export function calculateAverageRating(ratings: number[]): number {
  if (ratings.length === 0) return 0
  const sum = ratings.reduce((acc, rating) => acc + rating, 0)
  const average = sum / ratings.length
  return roundRating(average)
}
