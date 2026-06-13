'use client'

import { useState } from 'react'
import { Wand2, Loader, Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface HairstylePreviewProps {
  onClose?: () => void
}

// Popular hairstyles
const HAIRSTYLES = [
  { id: 1, name: 'Fade Cut', description: 'Short fade with sharp lines' },
  { id: 2, name: 'Buzz Cut', description: 'Uniform short buzz cut' },
  { id: 3, name: 'Pompadour', description: 'Classic pompadour with volume' },
  { id: 4, name: 'Undercut', description: 'Modern undercut style' },
  { id: 5, name: 'Textured Crop', description: 'Short textured crop' },
  { id: 6, name: 'Beard Style', description: 'Full beard with styling' },
  { id: 7, name: 'Long Waves', description: 'Long flowing wavy hair' },
  { id: 8, name: 'Bob Cut', description: 'Classic bob with layers' },
]

export default function HairstylePreview({ onClose }: HairstylePreviewProps) {
  const [selectedHairstyle, setSelectedHairstyle] = useState<typeof HAIRSTYLES[0] | null>(null)
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [images, setImages] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [customDescription, setCustomDescription] = useState('')

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      setUploadedImage(event.target?.result as string)
      setUploadedFile(file)
      setError('')
    }
    reader.readAsDataURL(file)
  }

  const handleGenerate = async () => {
    if (!uploadedImage) {
      setError('Please upload a selfie first')
      return
    }

    const hairstyle = selectedHairstyle || { name: customDescription, description: customDescription }
    if (!hairstyle.description || !hairstyle.description.trim()) {
      setError('Please select or describe a hairstyle')
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
          hairstyleDescription: hairstyle.description,
          imageUrl: uploadedImage,
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
    <div className="space-y-6">
      {/* Image Upload Section */}
      <div className="bg-gradient-to-b from-slate-900 to-slate-800 rounded-lg p-6 border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Upload className="h-5 w-5 text-indigo-400" />
          Step 1: Upload Your Selfie
        </h3>

        {uploadedImage ? (
          <div className="relative w-full max-w-sm mx-auto">
            <img src={uploadedImage} alt="Uploaded selfie" className="w-full rounded-lg border-2 border-indigo-500" />
            <button
              onClick={() => {
                setUploadedImage(null)
                setUploadedFile(null)
              }}
              className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 p-2 rounded-full"
            >
              <X className="h-4 w-4 text-white" />
            </button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-600 rounded-lg p-8 hover:border-indigo-500 hover:bg-slate-800/50 transition cursor-pointer">
            <Upload className="h-8 w-8 text-slate-400 mb-2" />
            <span className="text-slate-300 font-medium">Upload your selfie</span>
            <span className="text-sm text-slate-500 mt-1">PNG, JPG up to 5MB</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </label>
        )}
      </div>

      {/* Hairstyle Selection Section */}
      <div className="bg-gradient-to-b from-slate-900 to-slate-800 rounded-lg p-6 border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Wand2 className="h-5 w-5 text-indigo-400" />
          Step 2: Select a Hairstyle
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-4">
          {HAIRSTYLES.map((style) => (
            <button
              key={style.id}
              onClick={() => {
                setSelectedHairstyle(style)
                setCustomDescription('')
              }}
              className={`p-3 rounded-lg border-2 transition text-left ${
                selectedHairstyle?.id === style.id
                  ? 'border-indigo-500 bg-indigo-500/20'
                  : 'border-slate-600 bg-slate-800 hover:border-indigo-500'
              }`}
            >
              <p className="font-medium text-white text-sm">{style.name}</p>
              <p className="text-xs text-slate-400 mt-1">{style.description}</p>
            </button>
          ))}
        </div>

        {/* Custom Description */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Or describe your custom hairstyle
          </label>
          <textarea
            value={customDescription}
            onChange={(e) => {
              setCustomDescription(e.target.value)
              setSelectedHairstyle(null)
            }}
            placeholder="e.g., 'Long hair with bangs', 'Short spiky hair', 'Braided style'..."
            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 resize-none"
            rows={2}
          />
        </div>
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
        disabled={isLoading || !uploadedImage}
        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3"
      >
        {isLoading ? (
          <>
            <Loader className="h-4 w-4 mr-2 animate-spin" />
            Generating Preview... (This may take 30-60 seconds)
          </>
        ) : (
          <>
            <Wand2 className="h-4 w-4 mr-2" />
            Generate Hairstyle Preview
          </>
        )}
      </Button>

      {/* Results Section */}
      {images.length > 0 && (
        <div className="bg-gradient-to-b from-slate-900 to-slate-800 rounded-lg p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">✨ Your Hairstyle Preview</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-slate-400 mb-2">Original</p>
              <img src={uploadedImage} alt="Original" className="w-full rounded-lg border border-slate-600" />
            </div>
            {images.map((img, idx) => (
              <div key={idx}>
                <p className="text-sm text-slate-400 mb-2">Generated Preview</p>
                <img src={img} alt={`Preview ${idx + 1}`} className="w-full rounded-lg border-2 border-indigo-500" />
                <a
                  href={img}
                  download={`hairstyle-preview-${Date.now()}.png`}
                  className="mt-2 inline-block px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-sm font-medium"
                >
                  Download
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info Section */}
      <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
        <p className="text-sm text-blue-300">
          <strong>⏱️ Note:</strong> Generating AI previews takes 30-60 seconds as the model processes your image. 
          The result is displayed side-by-side with your original photo for easy comparison.
        </p>
      </div>
    </div>
  )
}
