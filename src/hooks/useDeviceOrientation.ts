import { useState, useEffect, useCallback } from 'react'

interface DeviceOrientation {
  alpha: number | null // Compass direction (0-360, 0 = North)
  beta: number | null  // Front-to-back tilt (-180 to 180)
  gamma: number | null // Left-to-right tilt (-90 to 90)
  absolute: boolean
}

interface UseDeviceOrientationResult {
  orientation: DeviceOrientation
  isSupported: boolean
  isPermissionGranted: boolean
  requestPermission: () => Promise<boolean>
  error: string | null
}

export function useDeviceOrientation(): UseDeviceOrientationResult {
  const [orientation, setOrientation] = useState<DeviceOrientation>({
    alpha: null,
    beta: null,
    gamma: null,
    absolute: false,
  })
  const [isSupported, setIsSupported] = useState(false)
  const [isPermissionGranted, setIsPermissionGranted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Check if DeviceOrientationEvent is supported
  useEffect(() => {
    const supported = 'DeviceOrientationEvent' in window
    setIsSupported(supported)

    // On non-iOS devices, permission is usually auto-granted
    if (supported && !('requestPermission' in DeviceOrientationEvent)) {
      setIsPermissionGranted(true)
    }
  }, [])

  // Handle orientation changes
  const handleOrientation = useCallback((event: DeviceOrientationEvent) => {
    // For iOS, webkitCompassHeading gives the compass direction
    // For other devices, alpha is the compass direction when absolute is true
    let compassHeading = event.alpha

    // iOS Safari provides webkitCompassHeading
    if ('webkitCompassHeading' in event) {
      compassHeading = (event as DeviceOrientationEvent & { webkitCompassHeading: number }).webkitCompassHeading
    }

    setOrientation({
      alpha: compassHeading,
      beta: event.beta,
      gamma: event.gamma,
      absolute: event.absolute,
    })
  }, [])

  // Request permission (required on iOS 13+)
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      setError('Device orientation not supported')
      return false
    }

    // iOS 13+ requires explicit permission
    if ('requestPermission' in DeviceOrientationEvent) {
      try {
        const permission = await (DeviceOrientationEvent as unknown as {
          requestPermission: () => Promise<'granted' | 'denied'>
        }).requestPermission()

        if (permission === 'granted') {
          setIsPermissionGranted(true)
          setError(null)
          return true
        } else {
          setError('Permission denied')
          return false
        }
      } catch (err) {
        setError('Failed to request permission')
        return false
      }
    }

    // Non-iOS devices
    setIsPermissionGranted(true)
    return true
  }, [isSupported])

  // Start listening when permission is granted
  useEffect(() => {
    if (!isSupported || !isPermissionGranted) return

    window.addEventListener('deviceorientation', handleOrientation, true)

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation, true)
    }
  }, [isSupported, isPermissionGranted, handleOrientation])

  return {
    orientation,
    isSupported,
    isPermissionGranted,
    requestPermission,
    error,
  }
}

// Calculate if the device is pointing at a specific position in the sky
export function isPointingAt(
  deviceAzimuth: number | null,
  deviceAltitude: number | null,
  targetAzimuth: number,
  targetAltitude: number,
  tolerance: number = 15 // degrees
): { isPointing: boolean; distance: number } {
  if (deviceAzimuth === null || deviceAltitude === null) {
    return { isPointing: false, distance: 180 }
  }

  // Calculate angular distance between device direction and target
  // Normalize azimuth difference to -180 to 180
  let azimuthDiff = deviceAzimuth - targetAzimuth
  if (azimuthDiff > 180) azimuthDiff -= 360
  if (azimuthDiff < -180) azimuthDiff += 360

  const altitudeDiff = deviceAltitude - targetAltitude

  // Simple Euclidean distance in degrees (good enough for small angles)
  const distance = Math.sqrt(azimuthDiff * azimuthDiff + altitudeDiff * altitudeDiff)

  return {
    isPointing: distance <= tolerance,
    distance,
  }
}

// Convert device beta/gamma to altitude (how high the phone is pointing)
export function getDeviceAltitude(beta: number | null): number | null {
  if (beta === null) return null

  // beta is -180 to 180
  // When phone is flat face-up: beta ≈ 0
  // When phone is vertical (screen facing you): beta ≈ 90
  // When phone is pointing up at sky: beta ≈ 0 to -90 (tilted back)

  // Convert beta to altitude (0 = horizon, 90 = zenith)
  // When held normally and tilted back to look at sky:
  // beta goes from ~90 (vertical) to ~0 (horizontal) to ~-90 (pointing up)

  if (beta >= 0) {
    // Phone tilted forward or vertical
    return 90 - beta
  } else {
    // Phone tilted back (looking up at sky)
    return 90 - beta
  }
}
