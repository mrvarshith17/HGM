import { NextRequest, NextResponse } from 'next/server'
import { getStaffMember, updateStaffMember, deleteStaffMember } from '@/lib/local-staff-store'

// GET - Fetch specific staff member
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; staffId: string }> }
) {
  try {
    const { id: salonId, staffId } = await params

    console.log('[Staff API] Fetching staff member:', staffId)
    const result = await getStaffMember(salonId, staffId)

    return NextResponse.json(result)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('[Staff API] Error fetching staff member:', errorMessage)
    return NextResponse.json(
      { error: `Failed to fetch staff member: ${errorMessage}` },
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
    const { id: salonId, staffId } = await params
    const body = await req.json()

    console.log('[Staff API] Updating staff member:', staffId)
    const result = await updateStaffMember(salonId, staffId, body)

    return NextResponse.json(result)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('[Staff API] Error updating staff member:', errorMessage)
    return NextResponse.json(
      { error: `Failed to update staff member: ${errorMessage}` },
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

    console.log('[Staff API] Deleting staff member:', staffId)
    await deleteStaffMember(salonId, staffId)

    return NextResponse.json({ message: 'Staff member deleted successfully' })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('[Staff API] Error deleting staff member:', errorMessage)
    return NextResponse.json(
      { error: `Failed to delete staff member: ${errorMessage}` },
      { status: 500 }
    )
  }
}
