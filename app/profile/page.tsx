'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Navigation from '@/components/navigation'
import HairstylePreview from '@/components/hairstyle-preview'
import { Button } from '@/components/ui/button'

interface UserProfile {
  uid: string
  email: string
  name: string
  phone: string
  userType: 'customer' | 'salon_owner'
  profilePicture?: string
}

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [showHairstylePreview, setShowHairstylePreview] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const stored = localStorage.getItem('userData')
    if (!stored) {
      router.push('/auth/login')
      return
    }

    try {
      const userData = JSON.parse(stored) as UserProfile
      setProfile(userData)
    } catch (error) {
      localStorage.removeItem('userData')
      router.push('/auth/login')
    }
  }, [router])

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !profile) return

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('userId', profile.uid)

      const response = await fetch('/api/upload-profile-picture', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      const data = await response.json()

      // Update state
      setProfile({
        ...profile,
        profilePicture: data.profilePicture,
      })

      // Update localStorage
      const userData = JSON.parse(localStorage.getItem('userData') || '{}')
      userData.profilePicture = data.profilePicture
      localStorage.setItem('userData', JSON.stringify(userData))
    } catch (error) {
      console.error('Upload error:', error)
      alert('Failed to upload profile picture')
    } finally {
      setIsUploading(false)
    }
  }

  const handleDeletePicture = async () => {
    if (!profile || !confirm('Are you sure you want to delete your profile picture?')) return

    try {
      const response = await fetch(`/api/delete-profile-picture?userId=${profile.uid}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Delete failed')
      }

      // Update state
      setProfile({
        ...profile,
        profilePicture: undefined,
      })

      // Update localStorage
      const userData = JSON.parse(localStorage.getItem('userData') || '{}')
      delete userData.profilePicture
      localStorage.setItem('userData', JSON.stringify(userData))
    } catch (error) {
      console.error('Delete error:', error)
      alert('Failed to delete profile picture')
    }
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900">
        <Navigation />
        <div className="mx-auto max-w-3xl px-6 py-20 text-center text-slate-300">
          <p>Loading profile…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900">
      <Navigation />
      <main className="mx-auto max-w-3xl px-6 py-12">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-8 shadow-lg shadow-black/20">
          <h1 className="text-4xl font-bold text-white mb-8">My Profile</h1>

          {/* Profile Picture Section */}
          <div className="mb-10 flex flex-col items-center gap-6">
            <div className="relative">
              <div className="flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 text-white font-bold text-4xl border-4 border-indigo-500">
                {profile.profilePicture ? (
                  <img
                    src={profile.profilePicture}
                    alt={profile.name}
                    className="h-full w-full rounded-full object-cover border-4 border-indigo-500"
                  />
                ) : (
                  getInitials(profile.name)
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {isUploading ? 'Uploading...' : 'Upload Picture'}
              </Button>
              {profile.profilePicture && (
                <Button
                  onClick={handleDeletePicture}
                  variant="outline"
                  className="border-red-600 text-red-400 hover:bg-red-950 hover:text-red-300"
                >
                  Delete Picture
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-4 text-slate-200">
            <div>
              <p className="text-sm text-slate-400">Name</p>
              <p className="text-lg font-medium">{profile.name}</p>
            </div>
            <div>
              <p className="text-sm text-slate-400">Email</p>
              <p className="text-lg font-medium">{profile.email}</p>
            </div>
            <div>
              <p className="text-sm text-slate-400">Phone</p>
              <p className="text-lg font-medium">{profile.phone}</p>
            </div>
            <div>
              <p className="text-sm text-slate-400">User Type</p>
              <p className="text-lg font-medium capitalize">{profile.userType.replace('_', ' ')}</p>
            </div>
          </div>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Button onClick={() => router.push('/search')} className="bg-indigo-600 hover:bg-indigo-700">
              Browse Salons
            </Button>
            <Button 
              onClick={() => setShowHairstylePreview(!showHairstylePreview)}
              variant="outline" 
              className="border-slate-700 text-white hover:bg-slate-800"
            >
              {showHairstylePreview ? 'Hide' : 'Try'} AI Hairstyle Preview
            </Button>
            {profile.userType === 'salon_owner' && (
              <Button onClick={() => router.push('/create-salon')} variant="outline" className="border-slate-700 text-white hover:bg-slate-800">
                Create Salon Profile
              </Button>
            )}
          </div>

          {/* Hairstyle Preview Section */}
          {showHairstylePreview && (
            <div className="mt-10 pt-10 border-t border-slate-700">
              <HairstylePreview onClose={() => setShowHairstylePreview(false)} />
            </div>
          )}
        </div>
      </main>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  )
}
