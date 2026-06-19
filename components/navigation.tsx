'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import ProfileAvatar from '@/components/profile-avatar'

export default function Navigation() {
  const { user } = useAuth()

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/80 backdrop-blur">
      <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600">
            <span className="font-bold text-white text-sm">HGM</span>
          </div>
          <span className="font-semibold text-white hidden sm:inline">HGM</span>
        </Link>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              <Link href="/search" className="text-sm text-slate-300 hover:text-white transition">
                Salons
              </Link>
              {user.userType === 'customer' && (
                <>
                  <Link href="/hairstyle" className="text-sm text-slate-300 hover:text-white transition flex items-center gap-1">
                    ✨ Hairstyles
                  </Link>
                  <Link href="/dashboard/user" className="text-sm text-slate-300 hover:text-white transition">
                    My Bookings
                  </Link>
                  <Link href="/dashboard/user/chat" className="text-sm text-slate-300 hover:text-white transition">
                    💬 Messages
                  </Link>
                </>
              )}
              {user.userType === 'salon_owner' && (
                <>
                  <Link href="/dashboard/salon" className="text-sm text-slate-300 hover:text-white transition">
                    Dashboard
                  </Link>
                  <Link href="/dashboard/owner/bookings" className="text-sm text-slate-300 hover:text-white transition">
                    My Bookings
                  </Link>
                  <Link href="/dashboard/owner/staff" className="text-sm text-slate-300 hover:text-white transition">
                    👥 Staff
                  </Link>
                  <Link href="/dashboard/owner/chat" className="text-sm text-slate-300 hover:text-white transition">
                    💬 Messages
                  </Link>
                  <Link href="/create-salon">
                    <Button size="sm" className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
                      Create Salon
                    </Button>
                  </Link>
                </>
              )}
              <ProfileAvatar user={user} />
            </>
          ) : (
            <>
              <Link href="/auth/login" className="text-sm text-slate-300 hover:text-white transition">
                Sign In
              </Link>
              <Link href="/auth/register">
                <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
                  Get Started
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
