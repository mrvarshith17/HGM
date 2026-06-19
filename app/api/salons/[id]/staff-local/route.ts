import { NextRequest, NextResponse } from 'next/server'
import { addStaffMember, getSalonStaff } from '@/lib/local-staff-store'

// POST - Add new staff member (LOCAL)
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: salonId } = await params
    const body = await req.json()

    const { name, specialization, bio, profilePicture, services, yearsExperience, certifications } = body

    // Validate required fields
    if (!name || !specialization) {
      return NextResponse.json(
        { error: 'Name and specialization are required' },
        { status: 400 }
      )
    }

    if (!services || services.length === 0) {
      return NextResponse.json(
        { error: 'At least one service is required' },
        { status: 400 }
      )
    }

    const staffData = {
      salonId,
      name,
      specialization,
      bio: bio || '',
      profilePicture: profilePicture || '',
      services: Array.isArray(services) ? services.filter(s => s && s.trim()) : [],
      yearsExperience: yearsExperience ? parseInt(yearsExperience) : 0,
      certifications: Array.isArray(certifications) ? certifications.filter(c => c && c.trim()) : [],
      rating: 0,
      reviewCount: 0,
    }

    console.log('[Staff API] Adding staff member to salon:', salonId)
    const result = await addStaffMember(salonId, staffData)
    
    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('[Staff API] Error adding staff member:', errorMessage, error)
    return NextResponse.json(
      { error: `Failed to add staff member: ${errorMessage}` },
      { status: 500 }
    )
  }
}

// GET - Fetch all staff members for a salon (LOCAL)
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: salonId } = await params

    console.log('[Staff API] Fetching staff for salon:', salonId)
    const result = await getSalonStaff(salonId)
    
    return NextResponse.json(result)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('[Staff API] Error fetching staff members:', errorMessage, error)
    return NextResponse.json(
      { error: `Failed to fetch staff members: ${errorMessage}` },
      { status: 500 }
    )
  }
}
