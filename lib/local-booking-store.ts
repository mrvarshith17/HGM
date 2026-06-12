import { promises as fs } from 'fs'
import { join } from 'path'
import { randomUUID } from 'crypto'
import { findLocalSalon } from '@/lib/local-salon-store'

type Booking = {
  id: string
  bookingId: string
  userId: string
  salonId: string
  serviceId: string | null
  services?: string[]
  customerName?: string
  customerEmail?: string
  customerPhone?: string
  appointmentDate: string
  appointmentTime: string
  notes: string
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  createdAt: string
  updatedAt: string
}

const DATA_DIR = join(process.cwd(), 'data')
const BOOKINGS_FILE = join(DATA_DIR, 'bookings.json')

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

function getBookingServices(booking: Booking) {
  if (booking.services?.length) {
    return booking.services
  }

  return booking.serviceId ? [booking.serviceId] : []
}

export async function readLocalBookings(): Promise<Booking[]> {
  await ensureDataDir()
  const contents = await readFileSafe(BOOKINGS_FILE)
  if (!contents) return []

  try {
    const data = JSON.parse(contents)
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

export async function writeLocalBookings(bookings: Booking[]) {
  await ensureDataDir()
  await fs.writeFile(BOOKINGS_FILE, JSON.stringify(bookings, null, 2), 'utf-8')
}

export async function addLocalBooking(payload: {
  userId: string
  salonId: string
  serviceId?: string | null
  services?: string[]
  customerName?: string
  customerEmail?: string
  customerPhone?: string
  appointmentDate: string
  appointmentTime: string
  notes?: string
}): Promise<Booking> {
  const bookings = await readLocalBookings()
  const booking: Booking = {
    id: randomUUID(),
    bookingId: randomUUID(),
    userId: payload.userId,
    salonId: payload.salonId,
    serviceId: payload.serviceId ?? payload.services?.[0] ?? null,
    services: payload.services ?? [],
    customerName: payload.customerName,
    customerEmail: payload.customerEmail,
    customerPhone: payload.customerPhone,
    appointmentDate: payload.appointmentDate,
    appointmentTime: payload.appointmentTime,
    notes: payload.notes ?? '',
    status: 'confirmed',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  bookings.push(booking)
  await writeLocalBookings(bookings)
  return booking
}

export async function findLocalBooking(id: string): Promise<Booking | null> {
  const bookings = await readLocalBookings()
  return bookings.find((booking) => booking.id === id) ?? null
}

export async function findLocalBookingsByUserId(userId: string) {
  const bookings = await readLocalBookings()
  return bookings.filter((booking) => booking.userId === userId)
}

export async function findLocalBookingsBySalonId(salonId: string) {
  const bookings = await readLocalBookings()
  return bookings.filter((booking) => booking.salonId === salonId)
}

export async function updateLocalBookingStatus(id: string, status: Booking['status']) {
  const bookings = await readLocalBookings()
  const booking = bookings.find((item) => item.id === id)
  if (!booking) return null
  booking.status = status
  booking.updatedAt = new Date().toISOString()
  await writeLocalBookings(bookings)
  return booking
}

export async function mapBookingSalonData(booking: Booking) {
  const salon = await findLocalSalon(booking.salonId)
  return {
    ...booking,
    services: getBookingServices(booking),
    salon: salon
      ? { name: salon.name, address: salon.address, phone: salon.phone }
      : { name: '', address: '', phone: '' },
  }
}

export async function mapBookingUserData(booking: Booking) {
  return {
    ...booking,
    services: getBookingServices(booking),
    customerName: booking.customerName || 'Customer',
    customerPhone: booking.customerPhone || '',
    customerEmail: booking.customerEmail || '',
    user: {
      name: booking.customerName || 'Customer',
      phone: booking.customerPhone || '',
      email: booking.customerEmail || '',
    },
  }
}
