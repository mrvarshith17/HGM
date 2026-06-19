import { NextRequest, NextResponse } from 'next/server'
import { getAllStats } from '@/lib/memory-chat-store'

// GET - Debug endpoint to see all chat data in memory
export async function GET(req: NextRequest) {
  try {
    const stats = getAllStats()
    
    console.log('[Debug Chat API] Memory stats:', stats)
    
    return NextResponse.json({
      status: 'ok',
      data: stats,
      timestamp: new Date().toISOString(),
    }, { status: 200 })
  } catch (error) {
    console.error('[Debug Chat API] GET error:', error)
    return NextResponse.json(
      { error: 'Failed to get stats' },
      { status: 500 }
    )
  }
}
