'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navigation from '@/components/navigation'
import { BookOpen, Users, MessageCircle } from 'lucide-react'

export default function OwnerDashboard() {
  const router = useRouter()

  useEffect(() => {
    const userType = localStorage.getItem('userType')
    if (userType !== 'salon_owner') {
      router.push('/auth/login')
      return
    }
  }, [router])

  const dashboardOptions = [
    {
      title: 'My Bookings',
      description: 'View and manage customer bookings',
      icon: BookOpen,
      href: '/dashboard/owner/bookings',
      color: 'from-blue-600 to-blue-700',
    },
    {
      title: 'Staff Management',
      description: 'Manage your salon staff members',
      icon: Users,
      href: '/dashboard/owner/staff',
      color: 'from-purple-600 to-purple-700',
    },
    {
      title: 'Messages',
      description: 'Chat with customers and staff',
      icon: MessageCircle,
      href: '/dashboard/owner/chat',
      color: 'from-indigo-600 to-indigo-700',
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900">
      <Navigation />

      <section className="px-6 py-12">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12">
            <h1 className="text-4xl font-bold text-white mb-2">Salon Owner Dashboard</h1>
            <p className="text-slate-400">Welcome! Manage your salon operations</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {dashboardOptions.map((option) => {
              const Icon = option.icon
              return (
                <button
                  key={option.href}
                  onClick={() => router.push(option.href)}
                  className="group relative overflow-hidden rounded-lg p-8 text-left transition-all hover:shadow-xl"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${option.color} opacity-0 group-hover:opacity-100 transition-opacity`} />
                  
                  <div className="relative z-10">
                    <div className="mb-4">
                      <div className="inline-flex rounded-lg bg-white/10 p-3 group-hover:bg-white/20 transition">
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                    </div>

                    <h3 className="mb-2 text-xl font-semibold text-white">{option.title}</h3>
                    <p className="text-sm text-slate-300 group-hover:text-slate-100 transition">{option.description}</p>
                  </div>

                  <div className="absolute inset-0 border border-slate-700 group-hover:border-slate-600 rounded-lg transition" />
                </button>
              )
            })}
          </div>

          <div className="mt-16 rounded-lg border border-slate-800 bg-slate-900/50 p-8 backdrop-blur">
            <h2 className="mb-4 text-2xl font-bold text-white">Quick Stats</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <p className="text-4xl font-bold text-blue-400">—</p>
                <p className="mt-2 text-slate-400">Total Bookings</p>
              </div>
              <div className="text-center">
                <p className="text-4xl font-bold text-purple-400">—</p>
                <p className="mt-2 text-slate-400">Staff Members</p>
              </div>
              <div className="text-center">
                <p className="text-4xl font-bold text-indigo-400">—</p>
                <p className="mt-2 text-slate-400">Active Conversations</p>
              </div>
            </div>
            <p className="mt-6 text-sm text-slate-500">Navigate to specific sections to view detailed statistics</p>
          </div>
        </div>
      </section>
    </div>
  )
}
