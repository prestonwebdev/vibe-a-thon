// Sirius - The brightest star in the night sky
// Believed to be where Neverland is located

// Sirius coordinates from Hipparcos catalog (HIP 32349)
// Right Ascension: 6h 45m 8.9s = 6.7525 hours
// Declination: -16° 42' 58" = -16.7161 degrees
// Apparent Magnitude: -1.46 (brightest star visible from Earth)
// Distance: 8.6 light years

export const SIRIUS = {
  name: 'Sirius',
  nickname: 'The Dog Star',
  destination: 'Neverland',

  // Celestial coordinates (fixed in space)
  rightAscension: 6.7525, // hours
  declination: -16.7161, // degrees

  // Star properties
  magnitude: -1.46,
  brightness: 1.0, // Brightest!
  color: '#A3C9FF', // Blue-white

  // Distance
  lightYears: 8.6,
}

// Calculate Local Sidereal Time (LST) for a given date and longitude
function getLocalSiderealTime(date: Date, longitudeDeg: number): number {
  // Julian date calculation
  const year = date.getUTCFullYear()
  const month = date.getUTCMonth() + 1
  const day = date.getUTCDate()
  const hour = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600

  let y = year
  let m = month
  if (m <= 2) {
    y -= 1
    m += 12
  }

  const A = Math.floor(y / 100)
  const B = 2 - A + Math.floor(A / 4)
  const JD = Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + hour / 24 + B - 1524.5

  // Calculate Greenwich Mean Sidereal Time
  const T = (JD - 2451545.0) / 36525
  let GMST = 280.46061837 + 360.98564736629 * (JD - 2451545.0) + 0.000387933 * T * T - T * T * T / 38710000

  // Normalize to 0-360
  GMST = GMST % 360
  if (GMST < 0) GMST += 360

  // Convert to Local Sidereal Time
  let LST = GMST + longitudeDeg
  LST = LST % 360
  if (LST < 0) LST += 360

  return LST // in degrees
}

// Calculate altitude and azimuth of Sirius from observer's location
export function getSiriusPosition(
  latitude: number,
  longitude: number,
  date: Date = new Date()
): {
  altitude: number // degrees above horizon
  azimuth: number // degrees from north, clockwise
  isVisible: boolean
  riseTime: string | null
  setTime: string | null
} {
  const latRad = (latitude * Math.PI) / 180
  const decRad = (SIRIUS.declination * Math.PI) / 180

  // Get Local Sidereal Time
  const LST = getLocalSiderealTime(date, longitude)

  // Hour Angle = LST - Right Ascension
  const raInDegrees = SIRIUS.rightAscension * 15 // Convert hours to degrees
  let HA = LST - raInDegrees
  if (HA < -180) HA += 360
  if (HA > 180) HA -= 360
  const haRad = (HA * Math.PI) / 180

  // Calculate altitude
  const sinAlt = Math.sin(latRad) * Math.sin(decRad) + Math.cos(latRad) * Math.cos(decRad) * Math.cos(haRad)
  const altitude = (Math.asin(sinAlt) * 180) / Math.PI

  // Calculate azimuth
  const cosAz = (Math.sin(decRad) - Math.sin(latRad) * sinAlt) / (Math.cos(latRad) * Math.cos((altitude * Math.PI) / 180))
  let azimuth = (Math.acos(Math.max(-1, Math.min(1, cosAz))) * 180) / Math.PI

  if (Math.sin(haRad) > 0) {
    azimuth = 360 - azimuth
  }

  // Calculate rise and set times (approximate)
  const cosH0 = -Math.tan(latRad) * Math.tan(decRad)
  let riseTime: string | null = null
  let setTime: string | null = null

  if (cosH0 >= -1 && cosH0 <= 1) {
    const H0 = (Math.acos(cosH0) * 180) / Math.PI // in degrees
    const riseHA = -H0
    const setHA = H0

    // Convert to approximate local time
    const riseHour = ((raInDegrees + riseHA - LST + longitude) / 15 + 24) % 24
    const setHour = ((raInDegrees + setHA - LST + longitude) / 15 + 24) % 24

    const formatTime = (h: number) => {
      const hours = Math.floor(h)
      const minutes = Math.floor((h - hours) * 60)
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
    }

    riseTime = formatTime(riseHour)
    setTime = formatTime(setHour)
  }

  return {
    altitude,
    azimuth,
    isVisible: altitude > 0,
    riseTime,
    setTime,
  }
}

// Convert altitude/azimuth to 3D position for visualization
export function getSirius3DPosition(
  altitude: number,
  azimuth: number,
  distance: number = 10
): { x: number; y: number; z: number } {
  const altRad = (altitude * Math.PI) / 180
  const azRad = (azimuth * Math.PI) / 180

  // Convert to Cartesian (Y is up, Z is north, X is east)
  return {
    x: distance * Math.cos(altRad) * Math.sin(azRad),
    y: distance * Math.sin(altRad),
    z: distance * Math.cos(altRad) * Math.cos(azRad),
  }
}

// Format compass direction from azimuth
export function getCompassDirection(azimuth: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
  const index = Math.round(azimuth / 22.5) % 16
  return directions[index]
}
