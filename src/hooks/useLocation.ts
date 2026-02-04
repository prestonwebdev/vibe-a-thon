import { useState, useEffect } from 'react'

interface Location {
  latitude: number
  longitude: number
  city?: string
  country?: string
}

interface LocationState {
  location: Location | null
  error: string | null
  isLoading: boolean
}

export function useLocation() {
  const [state, setState] = useState<LocationState>({
    location: null,
    error: null,
    isLoading: true,
  })

  useEffect(() => {
    if (!navigator.geolocation) {
      setState({
        location: null,
        error: 'Geolocation is not supported',
        isLoading: false,
      })
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords

        // Try to get city name via reverse geocoding (free API)
        let city: string | undefined
        let country: string | undefined

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`
          )
          if (response.ok) {
            const data = await response.json()
            city = data.address?.city || data.address?.town || data.address?.village
            country = data.address?.country
          }
        } catch {
          // Ignore geocoding errors
        }

        setState({
          location: { latitude, longitude, city, country },
          error: null,
          isLoading: false,
        })
      },
      (error) => {
        let errorMessage = 'Failed to get location'
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied'
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location unavailable'
            break
          case error.TIMEOUT:
            errorMessage = 'Location request timed out'
            break
        }

        // Fallback to a default location (Melbourne, Australia for the vibe-a-thon!)
        setState({
          location: {
            latitude: -37.8136,
            longitude: 144.9631,
            city: 'Melbourne',
            country: 'Australia',
          },
          error: errorMessage,
          isLoading: false,
        })
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      }
    )
  }, [])

  return state
}
