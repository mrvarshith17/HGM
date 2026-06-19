'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { useAuth, type User } from '@/hooks/useAuth'

interface ProfileAvatarProps {
  user: User
}

export default function ProfileAvatar({ user }: ProfileAvatarProps) {
  const { logout } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
    if (!file) return

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('userId', user.uid)

      const response = await fetch('/api/upload-profile-picture', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      // Reload page to show new picture
      window.location.reload()
    } catch (error) {
      console.error('Upload error:', error)
      alert('Failed to upload profile picture')
    } finally {
      setIsUploading(false)
    }
  }

  const handleDeletePicture = async () => {
    if (!confirm('Are you sure you want to delete your profile picture?')) return

    try {
      const response = await fetch(`/api/delete-profile-picture?userId=${user.uid}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Delete failed')
      }

      // Reload page to show initials again
      window.location.reload()
    } catch (error) {
      console.error('Delete error:', error)
      alert('Failed to delete profile picture')
    }
  }

  const handleLogout = () => {
    setIsOpen(false)
    logout()
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 text-white font-semibold text-sm hover:from-indigo-700 hover:to-purple-700 transition cursor-pointer border-2 border-indigo-500 hover:border-indigo-400"
        title={user.name}
      >
        {user.profilePicture ? (
          <img
            src={user.profilePicture}
            alt={user.name}
            className="h-full w-full rounded-full object-cover"
          />
        ) : (
          getInitials(user.name)
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-lg border border-slate-700 bg-slate-900 shadow-lg shadow-black/50 z-50">
          <div className="p-4 border-b border-slate-700">
            <p className="text-sm font-semibold text-white">{user.name}</p>
            <p className="text-xs text-slate-400">{user.email}</p>
          </div>

          <div className="py-2">
            <Link
              href="/profile"
              className="block px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition"
              onClick={() => setIsOpen(false)}
            >
              View Profile
            </Link>

            <button
              onClick={() => {
                fileInputRef.current?.click()
                setIsOpen(false)
              }}
              disabled={isUploading}
              className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition disabled:opacity-50"
            >
              {isUploading ? 'Uploading...' : 'Upload Picture'}
            </button>

            {user.profilePicture && (
              <button
                onClick={handleDeletePicture}
                className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-950 hover:text-red-300 transition"
              >
                Delete Picture
              </button>
            )}
          </div>

          <div className="border-t border-slate-700 py-2">
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition"
            >
              Logout
            </button>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}
