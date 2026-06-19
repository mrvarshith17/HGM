'use client'

import type { Staff } from '@/lib/db-staff-service'
import { Star, Award, Briefcase } from 'lucide-react'

interface StaffProfileCardProps {
  staff: Staff
  onSelect?: (staffId: string) => void
  selectable?: boolean
  selected?: boolean
}

export function StaffProfileCard({
  staff,
  onSelect,
  selectable = false,
  selected = false,
}: StaffProfileCardProps) {
  return (
    <div
      className={`border-2 rounded-lg p-6 transition ${
        selected
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-200 hover:border-gray-300 bg-white'
      } ${selectable ? 'cursor-pointer' : ''}`}
      onClick={() => selectable && onSelect?.(staff.staffId)}
    >
      <div className="flex gap-4">
        {/* Profile Picture */}
        <div className="flex-shrink-0">
          {staff.profilePicture ? (
            <img
              src={staff.profilePicture}
              alt={staff.name}
              className="w-20 h-20 rounded-full object-cover"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-2xl font-bold">
              {staff.name.charAt(0)}
            </div>
          )}
        </div>

        {/* Staff Info */}
        <div className="flex-1">
          {/* Name and Specialization */}
          <div>
            <h3 className="text-xl font-bold text-gray-900">{staff.name}</h3>
            <p className="text-sm text-blue-600 font-medium">{staff.specialization}</p>
          </div>

          {/* Rating */}
          {staff.rating > 0 && (
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < Math.floor(staff.rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm font-semibold text-gray-700">
                {staff.rating.toFixed(1)}
              </span>
              <span className="text-sm text-gray-500">
                ({staff.reviewCount} {staff.reviewCount === 1 ? 'review' : 'reviews'})
              </span>
            </div>
          )}

          {/* Experience */}
          {staff.yearsExperience && (
            <p className="text-sm text-gray-600 mt-2">
              💼 {staff.yearsExperience} years of experience
            </p>
          )}
        </div>
      </div>

      {/* Bio */}
      {staff.bio && (
        <p className="mt-4 text-sm text-gray-700 leading-relaxed">{staff.bio}</p>
      )}

      {/* Services */}
      {staff.services && staff.services.length > 0 && (
        <div className="mt-4">
          <div className="flex items-center gap-2 mb-2">
            <Briefcase className="w-4 h-4 text-gray-600" />
            <p className="text-sm font-semibold text-gray-800">Services</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {staff.services.map((service, i) => (
              <span
                key={i}
                className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full"
              >
                {service}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Certifications */}
      {staff.certifications && staff.certifications.length > 0 && (
        <div className="mt-4">
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-4 h-4 text-yellow-600" />
            <p className="text-sm font-semibold text-gray-800">Certifications</p>
          </div>
          <ul className="space-y-1">
            {staff.certifications.map((cert, i) => (
              <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                <span className="text-yellow-600 mt-1">✓</span>
                <span>{cert}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Selection Checkbox */}
      {selectable && (
        <div className="mt-4 flex items-center gap-2">
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onSelect?.(staff.staffId)}
            className="w-4 h-4 text-blue-600 rounded"
          />
          <label className="text-sm font-medium text-gray-700">
            {selected ? 'Selected' : 'Select this staff member'}
          </label>
        </div>
      )}
    </div>
  )
}
