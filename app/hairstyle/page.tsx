'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { ArrowLeft, Sparkles } from 'lucide-react'
import HairstylePreview from '@/components/hairstyle-preview'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function HairstylePage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 border-b border-slate-700 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/search">
              <Button variant="ghost" className="hover:bg-slate-700">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-indigo-400" />
                AI Hairstyle Preview
              </h1>
              <p className="text-sm text-slate-400">Try new hairstyles before visiting the salon</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-2">
            <HairstylePreview />
          </div>

          {/* Sidebar Info */}
          <div className="space-y-6">
            {/* How It Works */}
            <div className="bg-gradient-to-b from-slate-900 to-slate-800 rounded-lg p-6 border border-slate-700">
              <h3 className="text-lg font-semibold text-white mb-4">How It Works</h3>
              <ol className="space-y-3 text-sm text-slate-300">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 inline-flex items-center justify-center h-6 w-6 rounded-full bg-indigo-600 text-white text-xs font-medium">1</span>
                  <span>Upload a clear photo of your face</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 inline-flex items-center justify-center h-6 w-6 rounded-full bg-indigo-600 text-white text-xs font-medium">2</span>
                  <span>Choose a hairstyle from our collection or describe your own</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 inline-flex items-center justify-center h-6 w-6 rounded-full bg-indigo-600 text-white text-xs font-medium">3</span>
                  <span>Our AI generates a preview showing you with that hairstyle</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 inline-flex items-center justify-center h-6 w-6 rounded-full bg-indigo-600 text-white text-xs font-medium">4</span>
                  <span>Download and share your preview with friends or your stylist</span>
                </li>
              </ol>
            </div>

            {/* Tips */}
            <div className="bg-gradient-to-b from-purple-900/30 to-purple-800/20 rounded-lg p-6 border border-purple-700/30">
              <h3 className="text-lg font-semibold text-white mb-4">📸 Tips for Best Results</h3>
              <ul className="space-y-2 text-sm text-slate-300">
                <li>• Use a clear, well-lit front-facing photo</li>
                <li>• Make sure your full face is visible</li>
                <li>• Avoid filters or heavy makeup</li>
                <li>• Use JPG or PNG format</li>
                <li>• File size under 5MB</li>
              </ul>
            </div>

            {/* Features */}
            <div className="bg-gradient-to-b from-indigo-900/30 to-indigo-800/20 rounded-lg p-6 border border-indigo-700/30">
              <h3 className="text-lg font-semibold text-white mb-4">✨ Features</h3>
              <ul className="space-y-2 text-sm text-slate-300">
                <li>✓ AI-powered generation</li>
                <li>✓ Popular hairstyle presets</li>
                <li>✓ Custom descriptions</li>
                <li>✓ High-quality results</li>
                <li>✓ Download previews</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="max-w-6xl mx-auto px-4 py-8 mt-12 border-t border-slate-800">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div>
            <div className="text-3xl font-bold text-indigo-400 mb-2">100+</div>
            <p className="text-slate-400">Hairstyle Options</p>
          </div>
          <div>
            <div className="text-3xl font-bold text-indigo-400 mb-2">AI Powered</div>
            <p className="text-slate-400">Advanced Generation</p>
          </div>
          <div>
            <div className="text-3xl font-bold text-indigo-400 mb-2">Instant</div>
            <p className="text-slate-400">Results in 60 seconds</p>
          </div>
        </div>
      </div>
    </div>
  )
}
