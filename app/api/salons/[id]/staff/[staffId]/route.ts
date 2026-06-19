import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'

// GET - Fetch specific staff member
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; staffId: string }> }
) {
  try {
    const { staffId } = await params

    const staffSnap = await adminDb.collection('staff').doc(staffId).get()

    if (!staffSnap.exists) {
      return NextResponse.json(
        { error: 'Staff member not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      id: staffSnap.id,
      ...staffSnap.data()
    })
  } catch (error) {
    console.error('Error fetching staff member:', error)
    return NextResponse.json(
      { error: 'Failed to fetch staff member' },
      { status: 500 }
    )
  }
}

// PUT - Update staff member
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; staffId: string }> }
) {
  try {
    const { staffId } = await params
    const body = await req.json()

    const staffRef = adminDb.collection('staff').doc(staffId)
    const staffSnap = await staffRef.get()

    if (!staffSnap.exists) {
      return NextResponse.json(
        { error: 'Staff member not found' },
        { status: 404 }
      )
    }

    const updateData = {
      ...body,
      updatedAt: new Date(),
    }

    await staffRef.update(updateData)

    return NextResponse.json({
      id: staffId,
      ...staffSnap.data(),
      ...updateData
    })
  } catch (error) {
    console.error('Error updating staff member:', error)
    return NextResponse.json(
      { error: 'Failed to update staff member' },
      { status: 500 }
    )
  }
}

// DELETE - Remove staff member
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; staffId: string }> }
) {
  try {
    const { id: salonId, staffId } = await params

    const staffRef = adminDb.collection('staff').doc(staffId)
    const staffSnap = await staffRef.get()

    if (!staffSnap.exists) {
      return NextResponse.json(
        { error: 'Staff member not found' },
        { status: 404 }
      )
    }

    // Remove from salon's staffMembers array
    const salonRef = adminDb.collection('salons').doc(salonId)
    const salonSnap = await salonRef.get()

    if (salonSnap.exists) {
      const staffMembers = salonSnap.data()?.staffMembers || []
      const updatedStaffMembers = staffMembers.filter((id: string) => id !== staffId)
      await salonRef.update({ staffMembers: updatedStaffMembers })
    }

    // Delete staff document
    await staffRef.delete()

    return NextResponse.json({ message: 'Staff member deleted successfully' })
  } catch (error) {
    console.error('Error deleting staff member:', error)
    return NextResponse.json(
      { error: 'Failed to delete staff member' },
      { status: 500 }
    )
  }
}
