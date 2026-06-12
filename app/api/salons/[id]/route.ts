import { NextRequest, NextResponse } from 'next/server'
import { deleteLocalSalon, findLocalSalon } from '@/lib/local-salon-store'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const response = await fetch(`${API_URL}/salons/${id}`)
    const data = await response.json()

    if (!response.ok) {
      const localSalon = await findLocalSalon(id)
      if (localSalon) {
        return NextResponse.json(localSalon)
      }
      return NextResponse.json(data, { status: response.status })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Salon detail route error, using local fallback:', error)
    const { id } = await params
    const localSalon = await findLocalSalon(id)

    if (localSalon) {
      return NextResponse.json(localSalon)
    }

    return NextResponse.json(
      { error: 'Salon not found' },
      { status: 404 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  let ownerId = request.nextUrl.searchParams.get('ownerId') || undefined

  if (!ownerId) {
    const body = await request.json().catch(() => null) as { ownerId?: string } | null
    ownerId = body?.ownerId
  }

  try {
    const response = await fetch(`${API_URL}/salons/${id}`, {
      method: 'DELETE',
    })

    const data = await response.json().catch(() => ({}))

    if (response.ok) {
      await deleteLocalSalon(id, ownerId).catch(() => null)
      return NextResponse.json(data)
    }

    const deleted = await deleteLocalSalon(id, ownerId)
    if (deleted) {
      return NextResponse.json({ message: 'Salon deleted locally' })
    }

    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('Salon delete route error, using local fallback:', error)

    try {
      const deleted = await deleteLocalSalon(id, ownerId)
      if (deleted) {
        return NextResponse.json({ message: 'Salon deleted locally' })
      }
    } catch (fallbackError) {
      return NextResponse.json(
        { error: fallbackError instanceof Error ? fallbackError.message : 'Failed to delete salon' },
        { status: 403 }
      )
    }

    return NextResponse.json(
      { error: 'Salon not found' },
      { status: 404 }
    )
  }
}
