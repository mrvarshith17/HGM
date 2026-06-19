'use client'

import { useEffect, useRef, useState } from 'react'
import { SalonWithDistance } from '@/lib/google-maps-service'

interface MapProps {
  salons: SalonWithDistance[]
  userLocation?: { latitude: number; longitude: number }
  selectedSalonId?: string
  onSalonSelect?: (salonId: string) => void
  zoom?: number
  height?: string
}

interface GoogleMapsWindow extends Window {
  google?: {
    maps: {
      Map: any
      Marker: any
      InfoWindow: any
      LatLng: any
      LatLngBounds: any
    }
  }
}

export default function MapDisplay({
  salons,
  userLocation,
  selectedSalonId,
  onSalonSelect,
  zoom = 13,
  height = '500px',
}: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const infoWindowRef = useRef<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Wait for Google Maps to load with a timeout
    const checkGoogleMaps = () => {
      const googleMapsWindow = window as GoogleMapsWindow
      if (googleMapsWindow.google?.maps) {
        initializeMap()
      } else {
        // Google Maps not ready yet, wait for the load event
        const handleMapsLoaded = () => {
          initializeMap()
          window.removeEventListener('googleMapsLoaded', handleMapsLoaded)
        }

        const handleMapsError = () => {
          console.error(
            'Failed to load Google Maps API. Troubleshooting steps:\n' +
            '1. Verify your API key in .env.local\n' +
            '2. Enable billing in your Google Cloud project\n' +
            '3. Ensure these APIs are enabled: Maps JavaScript API, Geocoding API, Places API\n' +
            '4. Check API key restrictions (should be unrestricted or allow all HTTP referrers)\n' +
            '5. Check browser console for CORS errors'
          )
          setIsLoading(false)
          window.removeEventListener('googleMapsError', handleMapsError)
        }

        window.addEventListener('googleMapsLoaded', handleMapsLoaded)
        window.addEventListener('googleMapsError', handleMapsError)

        // Fallback: if script doesn't load within 5 seconds, show error
        const timeout = setTimeout(() => {
          console.warn('Google Maps took longer than 5 seconds to load. It might still load, but if you see map errors, check your API key.')
          window.removeEventListener('googleMapsLoaded', handleMapsLoaded)
          window.removeEventListener('googleMapsError', handleMapsError)
        }, 5000)

        return () => {
          clearTimeout(timeout)
          window.removeEventListener('googleMapsLoaded', handleMapsLoaded)
          window.removeEventListener('googleMapsError', handleMapsError)
        }
      }
    }

    const initializeMap = () => {
      if (!mapRef.current) return

      const googleMapsWindow = window as GoogleMapsWindow
      if (!googleMapsWindow.google?.maps) {
        console.error('Google Maps API not available')
        setIsLoading(false)
        return
      }

      const google = googleMapsWindow.google

      // Calculate initial center
      let center = { lat: 20.5937, lng: 78.9629 } // Default to India center
      if (userLocation) {
        center = {
          lat: userLocation.latitude,
          lng: userLocation.longitude,
        }
      } else if (salons.length > 0 && salons[0].latitude && salons[0].longitude) {
        center = {
          lat: salons[0].latitude,
          lng: salons[0].longitude,
        }
      }

      // Create map
      mapInstanceRef.current = new google.maps.Map(mapRef.current, {
        zoom,
        center,
        styles: [
          {
            featureType: 'all',
            stylers: [{ saturation: -80 }],
          },
          {
            featureType: 'road.arterial',
            elementType: 'geometry',
            stylers: [{ color: '#ffccff' }],
          },
          {
            featureType: 'poi.business',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }],
          },
        ],
      })

      infoWindowRef.current = new google.maps.InfoWindow()

      // Create user location marker if available
      if (userLocation) {
        new google.maps.Marker({
          position: {
            lat: userLocation.latitude,
            lng: userLocation.longitude,
          },
          map: mapInstanceRef.current,
          title: 'Your Location',
          icon: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
        })
      }

      // Create salon markers
      const bounds = new google.maps.LatLngBounds()
      markersRef.current = salons.map((salon) => {
        const marker = new google.maps.Marker({
          position: {
            lat: salon.latitude,
            lng: salon.longitude,
          },
          map: mapInstanceRef.current,
          title: salon.name,
          icon: selectedSalonId === salon.id
            ? 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
            : 'http://maps.google.com/mapfiles/ms/icons/orange-dot.png',
        })

        // Add click listener
        marker.addListener('click', () => {
          showInfoWindow(marker, salon)
          if (onSalonSelect) {
            onSalonSelect(salon.id)
          }
        })

        bounds.extend(marker.getPosition())
        return { marker, salonId: salon.id }
      })

      // Fit bounds if there are salons
      if (salons.length > 0) {
        if (userLocation) {
          bounds.extend({
            lat: userLocation.latitude,
            lng: userLocation.longitude,
          })
        }
        mapInstanceRef.current.fitBounds(bounds)
      }

      setIsLoading(false)
    }

    return checkGoogleMaps()
  }, [salons, userLocation, selectedSalonId, onSalonSelect, zoom])

  const showInfoWindow = (marker: any, salon: SalonWithDistance) => {
    const content = `
      <div style="padding: 12px; max-width: 250px;">
        <h3 style="margin: 0 0 8px 0; font-weight: bold; font-size: 14px;">${salon.name}</h3>
        <p style="margin: 4px 0; font-size: 12px; color: #666;">
          <strong>Address:</strong> ${salon.address}
        </p>
        <p style="margin: 4px 0; font-size: 12px; color: #666;">
          <strong>Phone:</strong> ${salon.phone}
        </p>
        ${salon.distanceFormatted ? `
          <p style="margin: 4px 0; font-size: 12px; color: #666;">
            <strong>Distance:</strong> ${salon.distanceFormatted}
          </p>
        ` : ''}
        <p style="margin: 4px 0; font-size: 12px; color: #666;">
          <strong>Rating:</strong> ⭐ ${salon.rating.toFixed(1)} (${salon.reviewCount} reviews)
        </p>
      </div>
    `

    if (infoWindowRef.current) {
      infoWindowRef.current.setContent(content)
      infoWindowRef.current.open(mapInstanceRef.current, marker)
    }
  }

  // Update marker color when selected salon changes
  useEffect(() => {
    markersRef.current.forEach(({ marker, salonId }) => {
      marker.setIcon(
        selectedSalonId === salonId
          ? 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
          : 'http://maps.google.com/mapfiles/ms/icons/orange-dot.png'
      )
    })
  }, [selectedSalonId])

  if (isLoading) {
    return (
      <div
        style={{ height }}
        className="flex items-center justify-center bg-gray-100 rounded-lg"
      >
        <div className="text-gray-600">Loading map...</div>
      </div>
    )
  }

  return <div ref={mapRef} style={{ width: '100%', height }} className="rounded-lg" />
}
