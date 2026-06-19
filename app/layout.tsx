import { Analytics } from '@vercel/analytics/next'
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'HGM - Hyderabad Grooming Marketplace',
  description: 'Discover top salons, book appointments, and preview hairstyles with AI',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const googleMapsApiKey = process.env.NEXT_PUBLIC_GCP_API_KEY

  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <head>
        {googleMapsApiKey && (
          <>
            <script
              src={`https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&libraries=places,geometry`}
              async
              defer
              onLoad={() => {
                // Signal that Google Maps is loaded
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('googleMapsLoaded'))
                }
              }}
              onError={() => {
                if (typeof window !== 'undefined') {
                  console.error('Failed to load Google Maps API. Check your API key and ensure billing is enabled.')
                  window.dispatchEvent(new CustomEvent('googleMapsError'))
                }
              }}
            ></script>
          </>
        )}
      </head>
      <body className="font-sans antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
