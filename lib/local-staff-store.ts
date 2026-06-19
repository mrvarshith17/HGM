import fs from 'fs'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

export interface Staff {
  id: string
  staffId: string
  salonId: string
  name: string
  specialization: string
  bio?: string
  profilePicture?: string
  services: string[]
  yearsExperience?: number
  certifications?: string[]
  availability?: Record<string, { start: string; end: string }>
  rating: number
  reviewCount: number
  createdAt: string | Date
  updatedAt: string | Date
}

const DATA_DIR = path.join(process.cwd(), 'data')
const STAFF_FILE = path.join(DATA_DIR, 'staff.json')

// Ensure data directory exists
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
}

// Read all staff data
function readStaffData(): Staff[] {
  ensureDataDir()
  try {
    if (fs.existsSync(STAFF_FILE)) {
      const data = fs.readFileSync(STAFF_FILE, 'utf-8')
      return JSON.parse(data)
    }
  } catch (error) {
    console.error('Error reading staff data:', error)
  }
  return []
}

// Write staff data
function writeStaffData(data: Staff[]) {
  ensureDataDir()
  try {
    fs.writeFileSync(STAFF_FILE, JSON.stringify(data, null, 2), 'utf-8')
  } catch (error) {
    console.error('Error writing staff data:', error)
    throw new Error('Failed to write staff data')
  }
}

export async function addStaffMember(salonId: string, staffData: Omit<Staff, 'id' | 'staffId' | 'createdAt' | 'updatedAt'>) {
  try {
    const allStaff = readStaffData()
    const staffId = uuidv4()
    
    const newStaff: Staff = {
      ...staffData,
      id: staffId,
      staffId: staffId,
      salonId,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    allStaff.push(newStaff)
    writeStaffData(allStaff)

    console.log('[Local Staff Store] Staff member added:', staffId)
    return newStaff
  } catch (error) {
    console.error('[Local Staff Store] Error adding staff:', error)
    throw error
  }
}

export async function getSalonStaff(salonId: string) {
  try {
    const allStaff = readStaffData()
    const salonStaff = allStaff.filter(s => s.salonId === salonId)
    
    console.log(`[Local Staff Store] Found ${salonStaff.length} staff members for salon ${salonId}`)
    return { data: salonStaff }
  } catch (error) {
    console.error('[Local Staff Store] Error getting salon staff:', error)
    throw error
  }
}

export async function getStaffMember(salonId: string, staffId: string) {
  try {
    const allStaff = readStaffData()
    const staff = allStaff.find(s => s.staffId === staffId && s.salonId === salonId)
    
    if (!staff) {
      throw new Error('Staff member not found')
    }

    return staff
  } catch (error) {
    console.error('[Local Staff Store] Error getting staff member:', error)
    throw error
  }
}

export async function findStaffById(staffId: string): Promise<Staff | null> {
  try {
    const allStaff = readStaffData()
    const staff = allStaff.find(s => s.staffId === staffId)
    return staff || null
  } catch (error) {
    console.error('[Local Staff Store] Error finding staff by ID:', error)
    return null
  }
}

export async function updateStaffMember(salonId: string, staffId: string, staffData: Partial<Staff>) {
  try {
    const allStaff = readStaffData()
    const index = allStaff.findIndex(s => s.staffId === staffId && s.salonId === salonId)

    if (index === -1) {
      throw new Error('Staff member not found')
    }

    allStaff[index] = {
      ...allStaff[index],
      ...staffData,
      updatedAt: new Date(),
    }

    writeStaffData(allStaff)
    console.log('[Local Staff Store] Staff member updated:', staffId)
    return allStaff[index]
  } catch (error) {
    console.error('[Local Staff Store] Error updating staff:', error)
    throw error
  }
}

export async function deleteStaffMember(salonId: string, staffId: string) {
  try {
    const allStaff = readStaffData()
    const index = allStaff.findIndex(s => s.staffId === staffId && s.salonId === salonId)

    if (index === -1) {
      throw new Error('Staff member not found')
    }

    allStaff.splice(index, 1)
    writeStaffData(allStaff)
    
    console.log('[Local Staff Store] Staff member deleted:', staffId)
    return { message: 'Staff member deleted successfully' }
  } catch (error) {
    console.error('[Local Staff Store] Error deleting staff:', error)
    throw error
  }
}
