'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSalons } from '@/lib/db-salon-service'
import { getSalonStaff, addStaffMember, updateStaffMember, deleteStaffMember } from '@/lib/db-staff-service-local'
import type { Staff } from '@/lib/db-staff-service-local'
import type { Salon } from '@/lib/db-salon-service'
import { Trash2, Plus, Edit2, X } from 'lucide-react'

export default function StaffManagementPage() {
  const router = useRouter()
  const [salons, setSalons] = useState<Salon[]>([])
  const [selectedSalonId, setSelectedSalonId] = useState('')
  const [selectedSalon, setSelectedSalon] = useState<Salon | null>(null)
  const [staff, setStaff] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    specialization: '',
    bio: '',
    profilePicture: '',
    yearsExperience: '',
    services: [''],
    certifications: [''],
  })

  // Load salons
  useEffect(() => {
    const loadSalons = async () => {
      try {
        setLoading(true)
        const authToken = localStorage.getItem('authToken')
        const userType = localStorage.getItem('userType')
        const salonId = localStorage.getItem('salonId')

        console.log('Loading salons - authToken:', !!authToken, 'userType:', userType, 'salonId:', salonId)

        // Check authentication
        if (!authToken || userType !== 'salon_owner') {
          console.log('Not authenticated as salon_owner, redirecting to login')
          router.push('/auth/login')
          return
        }

        // If user has a specific salon, use that
        if (salonId) {
          console.log('Using stored salon ID:', salonId)
          try {
            const response = await getSalons()
            console.log('All salons loaded:', response)
            const salon = response.find((s: Salon) => s.id === salonId)
            if (salon) {
              console.log('Found salon:', salon)
              setSalons([salon])
              setSelectedSalonId(salon.id)
              setSelectedSalon(salon)
            } else {
              console.error('Salon not found for ID:', salonId)
              setError('Salon not found')
            }
          } catch (err) {
            console.error('Failed to load salon:', err)
            setError('Failed to load salon')
          }
        } else {
          // Fallback: load all salons (shouldn't happen if properly logged in)
          console.log('No stored salon ID, loading all salons')
          const response = await getSalons()
          console.log('All salons loaded:', response)
          setSalons(response || [])
          if (response && response.length > 0) {
            console.log('Setting first salon as selected:', response[0])
            setSelectedSalonId(response[0].id)
            setSelectedSalon(response[0])
          } else {
            console.error('No salons found for user')
            setError('No salons found. Create a salon first.')
          }
        }
        setError('')
      } catch (err) {
        console.error('Failed to load salons:', err)
        setError('Failed to load salons')
      } finally {
        setLoading(false)
      }
    }

    loadSalons()
  }, [router])

  // Load staff for selected salon
  useEffect(() => {
    const loadStaff = async () => {
      if (!selectedSalonId) return

      try {
        setLoading(true)
        const response = await getSalonStaff(selectedSalonId)
        setStaff(response.data || [])
        setError('')
      } catch (err) {
        console.error('Failed to load staff:', err)
        setError('Failed to load staff members')
      } finally {
        setLoading(false)
      }
    }

    loadStaff()
  }, [selectedSalonId])

  const handleSalonChange = (salonId: string) => {
    setSelectedSalonId(salonId)
    const salon = salons.find(s => s.id === salonId) || null
    setSelectedSalon(salon)
  }

  const handleServiceChange = (index: number, value: string) => {
    const newServices = [...formData.services]
    newServices[index] = value
    setFormData({ ...formData, services: newServices })
  }

  const addServiceField = () => {
    setFormData({ ...formData, services: [...formData.services, ''] })
  }

  const removeServiceField = (index: number) => {
    const newServices = formData.services.filter((_, i) => i !== index)
    setFormData({ ...formData, services: newServices })
  }

  const handleCertificationChange = (index: number, value: string) => {
    const newCertifications = [...formData.certifications]
    newCertifications[index] = value
    setFormData({ ...formData, certifications: newCertifications })
  }

  const addCertificationField = () => {
    setFormData({ ...formData, certifications: [...formData.certifications, ''] })
  }

  const removeCertificationField = (index: number) => {
    const newCertifications = formData.certifications.filter((_, i) => i !== index)
    setFormData({ ...formData, certifications: newCertifications })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.specialization) {
      setError('Name and specialization are required')
      return
    }

    if (formData.services.filter(s => s.trim()).length === 0) {
      setError('Please add at least one service')
      return
    }

    try {
      setSaving(true)

      const staffPayload = {
        ...formData,
        services: formData.services.filter(s => s.trim()),
        certifications: formData.certifications.filter(c => c.trim()),
        yearsExperience: formData.yearsExperience ? parseInt(formData.yearsExperience) : 0,
        rating: editingStaffId ? staff.find(s => s.staffId === editingStaffId)?.rating || 0 : 0,
        reviewCount: editingStaffId ? staff.find(s => s.staffId === editingStaffId)?.reviewCount || 0 : 0,
      }

      console.log('Adding staff to salon:', selectedSalonId, 'Payload:', staffPayload)

      if (editingStaffId) {
        console.log('Updating staff member:', editingStaffId)
        await updateStaffMember(selectedSalonId, editingStaffId, staffPayload)
      } else {
        console.log('Creating new staff member')
        await addStaffMember(selectedSalonId, staffPayload)
      }

      console.log('Staff saved successfully, reloading...')
      // Reload staff
      const response = await getSalonStaff(selectedSalonId)
      console.log('Reloaded staff:', response)
      setStaff(response.data || [])

      // Reset form
      setFormData({
        name: '',
        specialization: '',
        bio: '',
        profilePicture: '',
        yearsExperience: '',
        services: [''],
        certifications: [''],
      })
      setEditingStaffId(null)
      setError('')
      alert('Staff member saved successfully!')
    } catch (err) {
      console.error('Failed to save staff:', err)
      setError(err instanceof Error ? err.message : 'Failed to save staff member')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (staffMember: Staff) => {
    setFormData({
      name: staffMember.name,
      specialization: staffMember.specialization,
      bio: staffMember.bio || '',
      profilePicture: staffMember.profilePicture || '',
      yearsExperience: staffMember.yearsExperience?.toString() || '',
      services: staffMember.services || [''],
      certifications: staffMember.certifications || [''],
    })
    setEditingStaffId(staffMember.staffId)
  }

  const handleDelete = async (staffId: string) => {
    if (!confirm('Are you sure you want to delete this staff member?')) return

    try {
      setSaving(true)
      await deleteStaffMember(selectedSalonId, staffId)

      // Reload staff
      const response = await getSalonStaff(selectedSalonId)
      setStaff(response.data || [])
      setError('')
    } catch (err) {
      console.error('Failed to delete staff:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete staff member')
    } finally {
      setSaving(false)
    }
  }

  if (loading && salons.length === 0) {
    return <div className="p-8">Loading...</div>
  }

  if (salons.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-600">No salons found. Please create a salon first.</p>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-8 bg-slate-950 min-h-screen">
      <h1 className="text-4xl font-bold mb-2 text-white">Staff Management</h1>
      <p className="text-slate-400 mb-8">Add and manage your staff members with their specializations and services</p>

      {/* Salon Selection */}
      <div className="mb-8">
        <label className="block text-sm font-medium text-slate-300 mb-2">Select Salon</label>
        <select
          value={selectedSalonId}
          onChange={(e) => handleSalonChange(e.target.value)}
          className="w-full px-4 py-3 border border-slate-700 rounded-lg bg-slate-900 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {salons.map((salon) => (
            <option key={salon.id} value={salon.id}>
              {salon.name}
            </option>
          ))}
        </select>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-900/80 border border-red-700 rounded-lg text-red-200">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Add/Edit Staff Form */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-8 rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold mb-8 text-white">
            {editingStaffId ? '✏️ Edit Staff Member' : '➕ Add New Staff Member'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-200">Basic Information</h3>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-700 rounded-lg bg-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={saving}
                  placeholder="e.g., Rahul Kumar"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Specialization *</label>
                <input
                  type="text"
                  value={formData.specialization}
                  onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-700 rounded-lg bg-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={saving}
                  placeholder="e.g., Hair Cutting Specialist"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Profile Picture URL</label>
                <input
                  type="url"
                  value={formData.profilePicture}
                  onChange={(e) => setFormData({ ...formData, profilePicture: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-700 rounded-lg bg-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={saving}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            </div>

            {/* Bio & Experience */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-200">Experience & Bio</h3>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Years of Experience</label>
                <input
                  type="number"
                  value={formData.yearsExperience}
                  onChange={(e) => setFormData({ ...formData, yearsExperience: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-700 rounded-lg bg-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={saving}
                  placeholder="5"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Bio</label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-700 rounded-lg bg-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={saving}
                  placeholder="Brief description of expertise, achievements, and specialties..."
                  rows={4}
                />
              </div>
            </div>

            {/* Services */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-200">Services Offered *</h3>
              {formData.services.map((service, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={service}
                    onChange={(e) => handleServiceChange(index, e.target.value)}
                    className="flex-1 px-4 py-2 border border-slate-700 rounded-lg bg-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={saving}
                    placeholder="e.g., Haircut, Coloring, Styling"
                  />
                  {formData.services.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeServiceField(index)}
                      className="px-3 py-2 bg-red-900/50 hover:bg-red-900 border border-red-700 rounded-lg text-red-200"
                      disabled={saving}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addServiceField}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 flex items-center gap-2"
                disabled={saving}
              >
                <Plus className="w-4 h-4" />
                Add Service
              </button>
            </div>

            {/* Certifications */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-200">Certifications & Awards</h3>
              {formData.certifications.map((cert, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={cert}
                    onChange={(e) => handleCertificationChange(index, e.target.value)}
                    className="flex-1 px-4 py-2 border border-slate-700 rounded-lg bg-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={saving}
                    placeholder="e.g., International Hair Styling Certification"
                  />
                  {formData.certifications.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeCertificationField(index)}
                      className="px-3 py-2 bg-red-900/50 hover:bg-red-900 border border-red-700 rounded-lg text-red-200"
                      disabled={saving}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addCertificationField}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 flex items-center gap-2"
                disabled={saving}
              >
                <Plus className="w-4 h-4" />
                Add Certification
              </button>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-2 pt-6 border-t border-slate-800">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition"
              >
                <Plus className="w-4 h-4" />
                {editingStaffId ? 'Update Staff Member' : 'Add Staff Member'}
              </button>

              {editingStaffId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingStaffId(null)
                    setFormData({
                      name: '',
                      specialization: '',
                      bio: '',
                      profilePicture: '',
                      yearsExperience: '',
                      services: [''],
                      certifications: [''],
                    })
                  }}
                  className="px-4 py-3 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg font-medium transition"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Staff List */}
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold mb-6 text-white">Your Staff ({staff.length})</h2>

          {loading ? (
            <div className="text-slate-400">Loading...</div>
          ) : staff.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <p>No staff members yet.</p>
              <p className="text-sm mt-2">Add one using the form →</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {staff.map((member) => (
                <div
                  key={member.staffId}
                  className="p-4 border border-slate-700 bg-slate-800/50 hover:bg-slate-800 rounded-lg transition"
                >
                  <div className="flex gap-4">
                    {member.profilePicture && (
                      <img
                        src={member.profilePicture}
                        alt={member.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white truncate">{member.name}</h3>
                      <p className="text-sm text-slate-400 truncate">{member.specialization}</p>
                      
                      {member.yearsExperience && (
                        <p className="text-xs text-slate-500 mt-1">
                          {member.yearsExperience} years experience
                        </p>
                      )}

                      {member.services && member.services.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {member.services.slice(0, 2).map((service, i) => (
                            <span
                              key={i}
                              className="inline-block px-2 py-1 bg-blue-900/50 text-blue-200 text-xs rounded"
                            >
                              {service}
                            </span>
                          ))}
                          {member.services.length > 2 && (
                            <span className="inline-block px-2 py-1 text-slate-400 text-xs">
                              +{member.services.length - 2} more
                            </span>
                          )}
                        </div>
                      )}

                      {member.rating > 0 && (
                        <p className="text-xs text-yellow-600 mt-2">
                          ⭐ {member.rating.toFixed(1)} ({member.reviewCount} reviews)
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 mt-3 pt-3 border-t border-slate-700">
                    <button
                      onClick={() => handleEdit(member)}
                      className="flex-1 px-2 py-1 text-sm bg-blue-900/50 hover:bg-blue-900 text-blue-200 rounded flex items-center justify-center gap-1 transition"
                      disabled={saving}
                    >
                      <Edit2 className="w-3 h-3" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(member.staffId)}
                      className="flex-1 px-2 py-1 text-sm bg-red-900/50 hover:bg-red-900 text-red-200 rounded flex items-center justify-center gap-1 transition"
                      disabled={saving}
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
