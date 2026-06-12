'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navigation from '@/components/navigation'
import LocationAutocomplete from '@/components/location-autocomplete'
import { Button } from '@/components/ui/button'

function parseServices(value: string) {
  return Array.from(new Set(
    value
      .split(/[\n,]/)
      .map((service) => service.trim())
      .filter(Boolean)
  ))
}

export default function CreateSalonPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [latitude, setLatitude] = useState<number | null>(null)
  const [longitude, setLongitude] = useState<number | null>(null)
  const [phone, setPhone] = useState('')
  const [description, setDescription] = useState('')
  const [servicesInput, setServicesInput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const services = parseServices(servicesInput)

  useEffect(() => {
    const authToken = localStorage.getItem('authToken')
    const userData = localStorage.getItem('userData')

    if (!authToken || !userData) {
      router.push('/auth/login')
      return
    }

    const user = JSON.parse(userData)
    if (user.userType !== 'salon_owner') {
      router.push('/dashboard/user')
    }
  }, [router])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      const storedUser = localStorage.getItem('userData')
      if (!storedUser) {
        throw new Error('User session expired. Please sign in again.')
      }

      const user = JSON.parse(storedUser)

      if (services.length === 0) {
        throw new Error('Please add at least one service your salon provides.')
      }

      const response = await fetch('/api/salons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerId: user.uid,
          name,
          address,
          phone,
          description,
          services,
        }),
      })

      if (!response.ok) {
        const body = await response.json()
        throw new Error(body.error || 'Unable to create salon')
      }

      setSuccess('Salon profile created successfully.')
      router.push('/dashboard/salon')
    } catch (err) {
      console.error('Create salon error:', err)
      setError(err instanceof Error ? err.message : 'Failed to create salon')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900">
      <Navigation />
      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-4xl font-bold text-white mb-6">Create Salon Profile</h1>
        <p className="mb-8 text-slate-400">
          Create your salon profile so customers can find you. Fill in the details below and then manage bookings from your salon dashboard.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6 rounded-lg border border-slate-800 bg-slate-900/80 p-8 shadow-lg shadow-black/20">
          {error && (
            <div className="rounded-lg bg-red-900/80 p-4 text-sm text-red-200 border border-red-700">{error}</div>
          )}
          {success && (
            <div className="rounded-lg bg-green-900/80 p-4 text-sm text-green-200 border border-green-700">{success}</div>
          )}

          <label className="block">
            <span className="text-sm text-slate-300">Salon Name</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white focus:border-indigo-500 focus:outline-none"
              placeholder="Your salon name"
            />
          </label>

          <label className="block">
            <span className="text-sm text-slate-300">Address</span>
            <div className="mt-2">
              <LocationAutocomplete
                value={address}
                onSelect={(details) => {
                  setAddress(details.address)
                  setLatitude(details.latitude)
                  setLongitude(details.longitude)
                }}
                placeholder="Search and select your salon location..."
                className="rounded-2xl"
              />
            </div>
            {latitude && longitude && (
              <p className="mt-2 text-xs text-slate-400">
                📍 Coordinates: {latitude.toFixed(4)}, {longitude.toFixed(4)}
              </p>
            )}
          </label>

          <label className="block">
            <span className="text-sm text-slate-300">Phone Number</span>
            <input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              required
              className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white focus:border-indigo-500 focus:outline-none"
              placeholder="Contact phone"
            />
          </label>

          <label className="block">
            <span className="text-sm text-slate-300">Description</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={5}
              className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white focus:border-indigo-500 focus:outline-none"
              placeholder="A short description of your salon"
            />
          </label>

          <label className="block">
            <span className="text-sm text-slate-300">Services Provided</span>
            <textarea
              value={servicesInput}
              onChange={(event) => setServicesInput(event.target.value)}
              rows={4}
              required
              className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              placeholder="Haircut, Hair Color, Beard Trim"
            />
          </label>

          {services.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {services.map((service) => (
                <span
                  key={service}
                  className="rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-sm text-indigo-100"
                >
                  {service}
                </span>
              ))}
            </div>
          )}

          <Button type="submit" className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold" disabled={loading}>
            {loading ? 'Creating salon...' : 'Create Salon'}
          </Button>
        </form>
      </main>
    </div>
  )
}
