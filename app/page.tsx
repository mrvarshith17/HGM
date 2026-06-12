'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import Navigation from '@/components/navigation'
import { ChevronRight, Scissors, MapPin, Calendar } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden px-6 py-24 sm:py-32">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_50%,rgba(139,92,246,0.3),transparent_50%)]"></div>
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_80%_80%,rgba(99,102,241,0.2),transparent_50%)]"></div>
        
        <div className="mx-auto max-w-4xl">
          <div className="text-center">
            <h1 className="text-balance text-5xl font-bold tracking-tight text-white sm:text-6xl">
              Transform Your Look with AI-Powered Salon Booking
            </h1>
            <p className="mt-6 text-balance text-lg leading-8 text-slate-300">
              Discover top-rated salons, preview hairstyles with AI, and book appointments instantly. All in one place.
            </p>
            
            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Link href="/search">
                <Button className="h-12 bg-indigo-600 px-8 text-base hover:bg-indigo-700">
                  Find Salons <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button variant="outline" className="h-12 border-slate-600 px-8 text-base text-white hover:bg-slate-800">
                  Join as Salon Owner
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white sm:text-5xl">Why Choose HGM?</h2>
            <p className="mt-4 text-lg text-slate-300">Everything you need for the perfect salon experience</p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-8 backdrop-blur">
              <div className="mb-4 inline-block rounded-lg bg-indigo-600/20 p-3">
                <MapPin className="h-6 w-6 text-indigo-400" />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-white">Find Top Salons</h3>
              <p className="text-slate-400">Discover highly-rated salons near you with detailed profiles and reviews.</p>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-8 backdrop-blur">
              <div className="mb-4 inline-block rounded-lg bg-purple-600/20 p-3">
                <Scissors className="h-6 w-6 text-purple-400" />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-white">AI Hairstyle Preview</h3>
              <p className="text-slate-400">Try on hairstyles with AI before committing. See yourself in any style instantly.</p>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-8 backdrop-blur">
              <div className="mb-4 inline-block rounded-lg bg-blue-600/20 p-3">
                <Calendar className="h-6 w-6 text-blue-400" />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-white">Easy Booking</h3>
              <p className="text-slate-400">Book appointments in seconds. Get instant confirmations and reminders.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-slate-800 bg-slate-900/50 px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">Ready to Transform Your Look?</h2>
          <p className="mt-4 text-lg text-slate-300">Start exploring salons and booking your next appointment today.</p>
          <Link href="/search" className="mt-8 inline-block">
            <Button className="h-12 bg-indigo-600 px-8 text-base hover:bg-indigo-700">
              Get Started Now
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 px-6 py-8 text-center text-sm text-slate-400">
        <p>&copy; 2024 HGM - Hyderabad Grooming Marketplace. All rights reserved.</p>
      </footer>
    </div>
  )
}
