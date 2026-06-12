'use client'

import { useState } from 'react'
import { Wand2, Loader } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface HairstylePreviewProps {
  onClose?: () => void
}

export default function HairstylePreview({ onClose }: HairstylePreviewProps) {
  const [description, setDescription] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleGenerate = async () => {
    if (!description.trim()) {
      setError('Please enter a hairstyle description')
      return
    }

    setIsLoading(true)
    setError('')
    setImages([])

    try {
      const response = await fetch('/api/hairstyle-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hairstyleDescription: description,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to generate preview')
        return
      }

      setImages(data.images || [])
    } catch (err) {
      setError('Error generating preview. Please try again.')
      console.error('Preview generation error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-gradient-to-b from-slate-900 to-slate-800 rounded-lg p-6 border border-slate-700">
      <div className="flex items-center gap-2 mb-4">
        <Wand2 className="h-5 w-5 text-indigo-400" />
        <h3 className="text-lg font-semibold text-white">AI Hairstyle Preview</h3>
      </div>

      <div className="space-y-4">
        {/* Input */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Describe your desired hairstyle
          </label>
          <textarea
            value={description}
            onChange={(e) => {
              setDescription(e.target.value)
              setError('')
            }}
            placeholder="e.g., 'Short bob with layers', 'Long wavy hair with bangs', 'Undercut with fade'..."
            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 resize-none"
            rows={3}
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-900/20 border border-red-700 rounded-lg text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Generate Button */}
        <Button
          onClick={handleGenerate}
          disabled={isLoading || !description.trim()}
          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader className="h-4 w-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Wand2 className="h-4 w-4 mr-2" />
              Generate Preview
            </>
          )}
        </Button>

        {/* Generated Images */}
        {images.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-slate-300">Generated Previews:</h4>
            <div className="grid grid-cols-1 gap-3">
              {images.map((imageUrl, index) => (
                <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-slate-900 border border-slate-700">
                  <img
                    src={imageUrl}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-400 text-center">
              AI-generated preview based on: "{description}"
            </p>
          </div>
        )}
      </div>

      {onClose && (
        <button
          onClick={onClose}
          className="mt-4 text-sm text-slate-400 hover:text-slate-300 transition"
        >
          Close
        </button>
      )}
    </div>
  )
}
