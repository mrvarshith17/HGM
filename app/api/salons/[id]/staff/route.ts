import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { v4 as uuidv4 } from 'uuid'

// POST - Add new staff member
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

    // Verify salon exists
    const salonRef = adminDb.collection('salons').doc(salonId)
    const salonSnap = await salonRef.get()

    if (!salonSnap.exists) {
      console.error(`Salon not found: ${salonId}`)
      return NextResponse.json(
        { error: 'Salon not found' },
        { status: 404 }
      )
    }

    // Create staff document
    const staffId = uuidv4()
    const staffData = {
      staffId,
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
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    console.log('Adding staff member:', staffData)

    await adminDb.collection('staff').doc(staffId).set(staffData)

    // Update salon's staffMembers array
    const salonData = salonSnap.data()
    const staffMembers = salonData?.staffMembers || []
    if (!staffMembers.includes(staffId)) {
      staffMembers.push(staffId)
      await salonRef.update({ staffMembers })
    }

    console.log('Staff member added successfully:', staffId)
    return NextResponse.json({ id: staffId, ...staffData }, { status: 201 })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('Error adding staff member:', errorMessage, error)
    return NextResponse.json(
      { error: `Failed to add staff member: ${errorMessage}` },
      { status: 500 }
    )
  }
}

// GET - Fetch all staff members for a salon
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: salonId } = await params

    console.log('Fetching staff for salon:', salonId)

    const staffSnap = await adminDb
      .collection('staff')
      .where('salonId', '==', salonId)
      .get()

    const staffMembers = staffSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))

    console.log(`Found ${staffMembers.length} staff members for salon ${salonId}`)
    return NextResponse.json({ data: staffMembers })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('Error fetching staff members:', errorMessage, error)
    return NextResponse.json(
      { error: `Failed to fetch staff members: ${errorMessage}` },
      { status: 500 }
    )
  }
}
