'use client'

import { useEffect, useState } from 'react'
import { getSalonStaff } from '@/lib/db-staff-service'
import type { Staff } from '@/lib/db-staff-service'
import { StaffProfileCard } from './staff-profile-card'

interface StaffSelectorProps {
  salonId: string
  selectedStaffId?: string | null
  onSelect: (staffId: string | null) => void
  optional?: boolean
  inline?: boolean
}

export function StaffSelector({
  salonId,
  selectedStaffId,
  onSelect,
  optional = true,
  inline = false,
}: StaffSelectorProps) {
  const [staff, setStaff] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showProfile, setShowProfile] = useState(false)

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        setLoading(true)
        const response = await getSalonStaff(salonId)
        setStaff(response.data || [])
        setError('')
      } catch (err) {
        console.error('Failed to load staff:', err)
        setError('Failed to load staff members')
        setStaff([])
      } finally {
        setLoading(false)
      }
    }

    fetchStaff()
  }, [salonId])

  if (loading) {
    return <div className="text-sm text-gray-500">Loading staff...</div>
  }

  if (error) {
    return <div className="text-sm text-red-500">{error}</div>
  }

  if (staff.length === 0) {
    return (
      <div className="text-sm text-gray-500">
        {optional ? 'No staff members available' : 'No staff members in this salon'}
      </div>
    )
  }

  // Inline mode: Simple dropdown select
  if (inline) {
    return (
      <div className="space-y-2">
        <label className="text-sm font-medium">
          {optional ? 'Select Staff (Optional)' : 'Select Staff'}
        </label>
        <select
          value={selectedStaffId || ''}
          onChange={(e) => onSelect(e.target.value || null)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">
            {optional ? 'Any Available Staff' : 'Select a staff member'}
          </option>
          {staff.map((member) => (
            <option key={member.staffId} value={member.staffId}>
              {member.name} - {member.specialization}
              {member.rating > 0 && ` ⭐ ${member.rating.toFixed(1)}`}
            </option>
          ))}
        </select>
      </div>
    )
  }

  // Card mode: Display detailed profiles
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          {optional ? 'Choose Your Stylist (Optional)' : 'Choose Your Stylist'}
        </h3>
        {optional && (
          <button
            onClick={() => onSelect(null)}
            className={`px-3 py-1 text-sm rounded ${
              selectedStaffId === null
                ? 'bg-gray-200 text-gray-900'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Any Available
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {staff.map((member) => (
          <StaffProfileCard
            key={member.staffId}
            staff={member}
            onSelect={onSelect}
            selectable={true}
            selected={selectedStaffId === member.staffId}
          />
        ))}
      </div>
    </div>
  )
}
