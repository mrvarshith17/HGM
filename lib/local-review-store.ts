import { promises as fs } from 'fs'
import { join } from 'path'
import { randomUUID } from 'crypto'
import { readLocalSalons, writeLocalSalons } from '@/lib/local-salon-store'

export type LocalReview = {
  id: string
  salonId: string
  bookingId: string
  userId: string
  userName: string
  rating: number
  comment: string
  createdAt: string
  updatedAt: string
}

const DATA_DIR = join(process.cwd(), 'data')
const REVIEWS_FILE = join(DATA_DIR, 'reviews.json')

async function ensureDataDir() {
  await fs.mkdir(DATA_DIR, { recursive: true })
}

async function readFileSafe(path: string) {
  try {
    return await fs.readFile(path, 'utf-8')
  } catch {
    return null
  }
}

export async function readLocalReviews(): Promise<LocalReview[]> {
  await ensureDataDir()
  const contents = await readFileSafe(REVIEWS_FILE)
  if (!contents) return []

  try {
    const data = JSON.parse(contents)
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

export async function writeLocalReviews(reviews: LocalReview[]) {
  await ensureDataDir()
  await fs.writeFile(REVIEWS_FILE, JSON.stringify(reviews, null, 2), 'utf-8')
}

export async function findLocalReviewsBySalonId(salonId: string) {
  const reviews = await readLocalReviews()
  return reviews
    .filter((review) => review.salonId === salonId)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
}

export async function findLocalReviewsByUserId(userId: string) {
  const reviews = await readLocalReviews()
  return reviews.filter((review) => review.userId === userId)
}

export async function findLocalReviewByBookingId(bookingId: string) {
  const reviews = await readLocalReviews()
  return reviews.find((review) => review.bookingId === bookingId) ?? null
}

export async function recalculateLocalSalonRating(salonId: string) {
  const [salons, reviews] = await Promise.all([
    readLocalSalons(),
    findLocalReviewsBySalonId(salonId),
  ])
  const salon = salons.find((item) => item.id === salonId)

  if (!salon) {
    return null
  }

  salon.reviewCount = reviews.length
  salon.rating = reviews.length
    ? Number((reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1))
    : 0
  salon.updatedAt = new Date().toISOString()
  await writeLocalSalons(salons)
  return salon
}

export async function addLocalReview(payload: {
  salonId: string
  bookingId: string
  userId: string
  userName?: string
  rating: number
  comment: string
}) {
  const reviews = await readLocalReviews()

  if (reviews.some((review) => review.bookingId === payload.bookingId)) {
    throw new Error('LOCAL_REVIEW_EXISTS')
  }

  const now = new Date().toISOString()
  const review: LocalReview = {
    id: randomUUID(),
    salonId: payload.salonId,
    bookingId: payload.bookingId,
    userId: payload.userId,
    userName: payload.userName || 'Customer',
    rating: payload.rating,
    comment: payload.comment,
    createdAt: now,
    updatedAt: now,
  }

  reviews.push(review)
  await writeLocalReviews(reviews)
  await recalculateLocalSalonRating(payload.salonId)
  return review
}
