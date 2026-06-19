import { promises as fs } from 'fs'
import { join } from 'path'
import { randomUUID } from 'crypto'
import { getSalonCity } from './location'

type Salon = {
  id: string
  ownerId: string
  name: string
  address: string
  phone: string
  description: string
  city: string
  email: string
  rating: number
  reviewCount: number
  services: string[]
  profilePicture: string
  operatingHours: Record<string, string>
  latitude?: number
  longitude?: number
  createdAt: string
  updatedAt: string
}

const DATA_DIR = join(process.cwd(), 'data')
const SALONS_FILE = join(DATA_DIR, 'salons.json')

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

export async function readLocalSalons(): Promise<Salon[]> {
  await ensureDataDir()
  const fileContents = await readFileSafe(SALONS_FILE)
  if (!fileContents) {
    return []
  }

  try {
    const parsed = JSON.parse(fileContents)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export async function writeLocalSalons(salons: Salon[]) {
  await ensureDataDir()
  await fs.writeFile(SALONS_FILE, JSON.stringify(salons, null, 2), 'utf-8')
}

export async function addLocalSalon(payload: {
  ownerId: string
  name: string
  address: string
  city?: string
  phone: string
  description: string
  services?: string[]
}): Promise<Salon> {
  const salons = await readLocalSalons()
  const newSalon: Salon = {
    id: randomUUID(),
    ownerId: payload.ownerId,
    name: payload.name,
    address: payload.address,
    phone: payload.phone,
    description: payload.description,
    city: getSalonCity({ city: payload.city, address: payload.address }),
    email: '',
    rating: 0,
    reviewCount: 0,
    services: payload.services ?? [],
    profilePicture: '',
    operatingHours: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  salons.push(newSalon)
  await writeLocalSalons(salons)
  return newSalon
}

export async function findLocalSalon(id: string) {
  const salons = await readLocalSalons()
  return salons.find((salon) => salon.id === id) ?? null
}

export async function deleteLocalSalon(id: string, ownerId?: string) {
  const salons = await readLocalSalons()
  const salon = salons.find((item) => item.id === id) ?? null

  if (!salon) {
    return null
  }

  if (ownerId && salon.ownerId !== ownerId) {
    throw new Error('You can only delete your own salon')
  }

  await writeLocalSalons(salons.filter((item) => item.id !== id))
  return salon
}
