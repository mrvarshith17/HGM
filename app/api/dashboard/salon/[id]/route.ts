import { NextRequest, NextResponse } from 'next/server'
import { findLocalBookingsBySalonId, mapBookingUserData, readLocalBookings } from '@/lib/local-booking-store'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const response = await fetch(`${API_URL}/dashboard/salon/${id}`)
    const data = await response.json()

    if (!response.ok) {
      // Fallback to local bookings
      const localBookings = await findLocalBookingsBySalonId(id)
      const enriched = await Promise.all(localBookings.map(mapBookingUserData))
      
      const todayBookings = enriched.filter(b => {
        const bookingDate = new Date(b.appointmentDate).toDateString()
        const today = new Date().toDateString()
        return bookingDate === today && b.status !== 'cancelled'
      })

      console.log(`[dashboard salon ${id}] Found ${localBookings.length} local bookings, ${todayBookings.length} for today`)

      return NextResponse.json({
        todayBookings,
        allBookings: enriched,
        stats: {
          totalBookings: enriched.length,
          todayBookings: todayBookings.length,
          totalCompleted: enriched.filter(b => b.status === 'completed').length,
          averageRating: 0,
        },
      })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Salon dashboard route error, using local fallback:', error)
    const { id } = await params
    
    // Debug: log all bookings in the system
    const allSystemBookings = await readLocalBookings()
    console.log(`[dashboard debug] All bookings in system: ${allSystemBookings.length}`)
    allSystemBookings.forEach(b => console.log(`  - salonId: ${b.salonId}, looking for: ${id}`))
    
    const localBookings = await findLocalBookingsBySalonId(id)
    const enriched = await Promise.all(localBookings.map(mapBookingUserData))
    
    const todayBookings = enriched.filter(b => {
      const bookingDate = new Date(b.appointmentDate).toDateString()
      const today = new Date().toDateString()
      return bookingDate === today && b.status !== 'cancelled'
    })

    console.log(`[dashboard salon ${id}] Found ${localBookings.length} local bookings, ${todayBookings.length} for today`)

    return NextResponse.json({
      todayBookings,
      allBookings: enriched,
      stats: {
        totalBookings: enriched.length,
        todayBookings: todayBookings.length,
        totalCompleted: enriched.filter(b => b.status === 'completed').length,
        averageRating: 0,
      },
    })
  }
}
