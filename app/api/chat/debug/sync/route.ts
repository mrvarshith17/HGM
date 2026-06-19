import { NextRequest, NextResponse } from 'next/server'
import { getAllStats, getSalonRooms } from '@/lib/memory-chat-store'

// GET - Comprehensive debug info for troubleshooting message sync
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const ownerId = searchParams.get('ownerId')
    const salonId = searchParams.get('salonId')

    console.log('[Debug Sync API] GET with params:', { ownerId, salonId })

    const stats = getAllStats()

    if (salonId) {
      // Get rooms for specific salon
      const rooms = getSalonRooms(salonId)
      return NextResponse.json({
        mode: 'salon-specific',
        salonId,
        rooms,
        roomCount: rooms.length,
        totalStats: stats,
      })
    }

    // Return all stats
    return NextResponse.json({
      mode: 'all-stats',
      ...stats,
    })
  } catch (error) {
    console.error('[Debug Sync API] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to get debug info',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
