'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getSalonStaff } from '@/lib/db-staff-service'
import { getSalon } from '@/lib/db-salon-service'
import { StaffProfileCard } from '@/components/staff-profile-card'
import type { Staff } from '@/lib/db-staff-service'
import type { Salon } from '@/lib/db-salon-service'

export default function SalonStaffPage() {
  const params = useParams()
  const router = useRouter()
  const salonId = params.id as string

  const [salon, setSalon] = useState<Salon | null>(null)
  const [staff, setStaff] = useState<Staff[]>([])
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadData = async () => {
      if (!salonId) {
        setError('Invalid salon ID')
        return
      }

      try {
        setLoading(true)
        
        // Fetch salon details
        const salonData = await getSalon(salonId)
        setSalon(salonData)

        // Fetch staff
        const staffData = await getSalonStaff(salonId)
        setStaff(staffData.data || [])
        
        setError('')
      } catch (err) {
        console.error('Failed to load data:', err)
        setError('Failed to load salon staff information')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [salonId])

  const handleBookWithStaff = (staffId: string | null) => {
    // Navigate to booking page with staff ID as query parameter
    if (staffId) {
      router.push(`/salon/${salonId}?staffId=${staffId}#booking`)
    } else {
      router.push(`/salon/${salonId}#booking`)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 flex items-center justify-center">
        <div className="text-white text-lg">Loading staff information...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 flex items-center justify-center">
        <div className="text-red-400 text-lg">{error}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12">
          <button
            onClick={() => router.back()}
            className="mb-4 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
          >
            ← Back
          </button>
          
          <h1 className="text-4xl font-bold text-white mb-2">
            {salon?.name} - Our Team
          </h1>
          <p className="text-slate-400">
            Meet our talented stylists and choose your preferred professional for your appointment
          </p>
        </div>

        {staff.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-400 text-lg">No staff members available at this salon yet</p>
          </div>
        ) : (
          <>
            {/* Staff Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {staff.map((member) => (
                <div key={member.staffId} className="relative">
                  <StaffProfileCard
                    staff={member}
                    selected={selectedStaffId === member.staffId}
                    selectable={false}
                  />
                  <button
                    onClick={() => setSelectedStaffId(member.staffId)}
                    className={`w-full mt-3 py-2 rounded-lg font-medium transition ${
                      selectedStaffId === member.staffId
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                    }`}
                  >
                    {selectedStaffId === member.staffId ? '✓ Selected' : 'Select'}
                  </button>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => handleBookWithStaff(selectedStaffId)}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition"
                disabled={!selectedStaffId}
              >
                {selectedStaffId
                  ? 'Book Appointment with Selected Stylist'
                  : 'Select a Stylist to Continue'}
              </button>

              <button
                onClick={() => {
                  setSelectedStaffId(null)
                  handleBookWithStaff(null)
                }}
                className="px-8 py-3 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg font-semibold transition"
              >
                Book with Any Available
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
