import { motion, useMotionValue, useSpring } from 'motion/react'
import { useEffect, useState, useRef, useMemo } from 'react'

interface PixieDustParticle {
  id: number
  x: number
  y: number
  size: number
  color: string
  delay: number
}

interface Destination {
  id: string
  name: string
  category: 'landmark' | 'fictional'
  icon: string
  lat?: number // Latitude (for landmarks)
  lng?: number // Longitude (for landmarks)
  fixedAz?: number // Fixed azimuth (for fictional)
  fixedAlt?: number // Fixed altitude (for fictional)
}

const DESTINATIONS: Destination[] = [
  // Landmarks
  { id: 'bigben', name: 'Big Ben', category: 'landmark', icon: '🏛️', lat: 51.5007, lng: -0.1246 },
  { id: 'eiffel', name: 'Eiffel Tower', category: 'landmark', icon: '🗼', lat: 48.8584, lng: 2.2945 },
  { id: 'sydney', name: 'Sydney Opera House', category: 'landmark', icon: '🎭', lat: -33.8568, lng: 151.2153 },
  { id: 'fuji', name: 'Mount Fuji', category: 'landmark', icon: '🗻', lat: 35.3606, lng: 138.7274 },
  // Magical Places
  { id: 'secondstar', name: 'Second Star to the Right', category: 'fictional', icon: '💫', fixedAz: 90, fixedAlt: 45 },
  { id: 'neverland', name: 'Neverland', category: 'fictional', icon: '🧚', fixedAz: 95, fixedAlt: 30 },
]

// Calculate bearing to Earth location
function calculateBearing(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const lat1Rad = lat1 * Math.PI / 180
  const lat2Rad = lat2 * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180

  const y = Math.sin(dLng) * Math.cos(lat2Rad)
  const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLng)

  let bearing = Math.atan2(y, x) * 180 / Math.PI
  bearing = (bearing + 360) % 360

  return bearing
}

// Calculate distance between two Earth coordinates using Haversine formula (returns meters)
function calculateDistanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000 // Earth's radius in meters
  const lat1Rad = lat1 * Math.PI / 180
  const lat2Rad = lat2 * Math.PI / 180
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c
}

// Format distance for display
function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`
  } else if (meters < 100000) {
    return `${(meters / 1000).toFixed(1)} km`
  } else if (meters < 1000000) {
    return `${Math.round(meters / 1000)} km`
  } else {
    return `${(meters / 1000).toLocaleString()} km`
  }
}

// Calculate pixie dust needed for journey (1 pinch per 100km)
function calculatePixieDust(meters: number): string {
  const km = meters / 1000
  if (km < 100) {
    return '1 pinch'
  } else if (km < 1000) {
    return `${Math.ceil(km / 100)} pinches`
  } else if (km < 10000) {
    return `${Math.ceil(km / 500)} handfuls`
  } else {
    return `${Math.ceil(km / 2000)} sparkle-clouds`
  }
}

// Get compass direction label
function getDirectionLabel(azimuth: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
  const index = Math.round(azimuth / 22.5) % 16
  return directions[index]
}

function PeterPanCompass() {
  const [particles, setParticles] = useState<PixieDustParticle[]>([])
  const [selectedDestination, setSelectedDestination] = useState<Destination>(DESTINATIONS[0])
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [locationStatus, setLocationStatus] = useState<'loading' | 'granted' | 'denied'>('loading')
  const [neverlandDrift, setNeverlandDrift] = useState(0)
  const particleIdRef = useRef(0)
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const springX = useSpring(mouseX, { stiffness: 150, damping: 15 })
  const springY = useSpring(mouseY, { stiffness: 150, damping: 15 })

  // Request geolocation
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
          setLocationStatus('granted')
        },
        () => {
          // Fallback to San Francisco
          setUserLocation({ lat: 37.7749, lng: -122.4194 })
          setLocationStatus('denied')
        },
        { enableHighAccuracy: true, timeout: 10000 }
      )
    } else {
      setUserLocation({ lat: 37.7749, lng: -122.4194 })
      setLocationStatus('denied')
    }
  }, [])

  // Neverland magical drift
  useEffect(() => {
    if (selectedDestination.id === 'neverland') {
      const interval = setInterval(() => {
        setNeverlandDrift(Math.sin(Date.now() / 2000) * 10)
      }, 100)
      return () => clearInterval(interval)
    }
  }, [selectedDestination])

  // Calculate direction, elevation, and distance to destination
  const { azimuth, altitude, distanceDisplay } = useMemo(() => {
    if (!userLocation) return { azimuth: 0, altitude: 0, distanceDisplay: '' }

    const dest = selectedDestination

    if (dest.category === 'landmark' && dest.lat !== undefined && dest.lng !== undefined) {
      const bearing = calculateBearing(userLocation.lat, userLocation.lng, dest.lat, dest.lng)
      const distMeters = calculateDistanceMeters(userLocation.lat, userLocation.lng, dest.lat, dest.lng)
      const pixieDust = calculatePixieDust(distMeters)
      return {
        azimuth: bearing,
        altitude: 0,
        distanceDisplay: `${formatDistance(distMeters)} (${pixieDust} of Pixie Dust)`,
      }
    }

    if (dest.category === 'fictional') {
      const az = (dest.fixedAz || 90) + (dest.id === 'neverland' ? neverlandDrift : 0)
      // Whimsical pixie dust for magical places - generate a nebulous random number
      const whimsicalNumber = Math.floor(Math.random() * 900 + 100) // 100-999
      const whimsicalUnits = ['twinkles', 'moonbeams', 'stardreams', 'fairywhispers', 'wonderglooms'][Math.floor(Math.random() * 5)]
      const magicalPixieDust = dest.id === 'neverland'
        ? `${whimsicalNumber} ${whimsicalUnits} of Pixie Dust`
        : `${Math.floor(Math.random() * 7 + 3)} tinkerbells of Pixie Dust`
      return {
        azimuth: az,
        altitude: dest.fixedAlt || 45,
        distanceDisplay: `(${magicalPixieDust})`,
      }
    }

    return { azimuth: 0, altitude: 0, distanceDisplay: '' }
  }, [userLocation, selectedDestination, neverlandDrift])

  // Track mouse and create pixie dust
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX)
      mouseY.set(e.clientY)

      const colors = ['#FFD700', '#FFFACD', '#98FB98', '#87CEEB', '#FFB6C1', '#E6E6FA']
      const newParticles: PixieDustParticle[] = []

      for (let i = 0; i < 3; i++) {
        newParticles.push({
          id: particleIdRef.current++,
          x: e.clientX + (Math.random() - 0.5) * 20,
          y: e.clientY + (Math.random() - 0.5) * 20,
          size: Math.random() * 8 + 4,
          color: colors[Math.floor(Math.random() * colors.length)],
          delay: i * 0.05,
        })
      }

      setParticles(prev => [...prev.slice(-50), ...newParticles])
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [mouseX, mouseY])

  // Clean up old particles
  useEffect(() => {
    const interval = setInterval(() => {
      setParticles(prev => prev.slice(-30))
    }, 500)
    return () => clearInterval(interval)
  }, [])

  const groupedDestinations = {
    landmark: DESTINATIONS.filter(d => d.category === 'landmark'),
    fictional: DESTINATIONS.filter(d => d.category === 'fictional'),
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#0a1628] via-[#1a2744] to-[#0d1f3c] text-white">
      {/* Neverland stars background */}
      <div className="absolute inset-0">
        {[...Array(100)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              width: Math.random() * 3 + 1,
              height: Math.random() * 3 + 1,
              backgroundColor: i % 5 === 0 ? '#FFD700' : '#ffffff',
            }}
            animate={{
              opacity: [0.3, 1, 0.3],
              scale: [1, i % 5 === 0 ? 1.8 : 1.3, 1],
            }}
            transition={{
              duration: Math.random() * 4 + 2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Second star to the right - brighter star */}
      <motion.div
        className="absolute right-32 top-24"
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.8, 1, 0.8],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <div className="relative">
          <div className="h-6 w-6 rounded-full bg-yellow-200 blur-sm" />
          <div className="absolute inset-0 h-6 w-6 rounded-full bg-yellow-100" />
          <motion.div
            className="absolute -inset-4 rounded-full bg-yellow-300/30 blur-xl"
            animate={{ scale: [1, 1.5, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>
      </motion.div>

      {/* Magical aurora effect */}
      <div className="absolute inset-0 overflow-hidden opacity-30">
        <motion.div
          className="absolute -left-1/4 top-0 h-full w-1/2 bg-gradient-to-b from-emerald-500/20 via-transparent to-transparent blur-3xl"
          animate={{ x: [0, 200, 0], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -right-1/4 top-0 h-full w-1/2 bg-gradient-to-b from-amber-500/20 via-transparent to-transparent blur-3xl"
          animate={{ x: [0, -200, 0], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Pixie dust particles */}
      {particles.map(particle => (
        <motion.div
          key={particle.id}
          className="pointer-events-none fixed z-50 rounded-full"
          style={{
            left: particle.x,
            top: particle.y,
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
            boxShadow: `0 0 ${particle.size * 2}px ${particle.color}, 0 0 ${particle.size * 4}px ${particle.color}`,
          }}
          initial={{ opacity: 1, scale: 1 }}
          animate={{
            opacity: 0,
            scale: 0,
            y: -30 + Math.random() * 60,
            x: (Math.random() - 0.5) * 40,
          }}
          transition={{
            duration: 0.8,
            delay: particle.delay,
            ease: "easeOut",
          }}
        />
      ))}

      {/* Tinkerbell cursor glow */}
      <motion.div
        className="pointer-events-none fixed z-40"
        style={{ x: springX, y: springY }}
      >
        <motion.div
          className="absolute -translate-x-1/2 -translate-y-1/2"
          animate={{ scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 0.5, repeat: Infinity }}
        >
          <div className="h-4 w-4 rounded-full bg-yellow-200/80" />
          <div className="absolute inset-0 h-4 w-4 rounded-full bg-yellow-100 blur-sm" />
          <div className="absolute -inset-2 rounded-full bg-yellow-300/40 blur-md" />
        </motion.div>
      </motion.div>

      {/* Main content */}
      <div className="relative flex min-h-screen flex-col items-center justify-center px-8 pt-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="text-center"
        >
          <motion.h2
            className="mb-2 text-lg tracking-[0.3em] text-amber-200/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            CELESTIAL NAVIGATOR
          </motion.h2>
          <motion.h1
            className="mb-6 bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-200 bg-clip-text text-5xl font-bold text-transparent"
            style={{ fontFamily: 'Georgia, serif' }}
          >
            Neverland Compass
          </motion.h1>
        </motion.div>

        {/* Destination Selector */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <select
            value={selectedDestination.id}
            onChange={(e) => {
              const dest = DESTINATIONS.find(d => d.id === e.target.value)
              if (dest) setSelectedDestination(dest)
            }}
            className="rounded-lg border border-amber-500/30 bg-amber-900/30 px-4 py-2 text-amber-100 backdrop-blur-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
            style={{ fontFamily: 'Georgia, serif' }}
          >
            <optgroup label="Landmarks">
              {groupedDestinations.landmark.map(d => (
                <option key={d.id} value={d.id}>{d.icon} {d.name}</option>
              ))}
            </optgroup>
            <optgroup label="Magical Places">
              {groupedDestinations.fictional.map(d => (
                <option key={d.id} value={d.id}>{d.icon} {d.name}</option>
              ))}
            </optgroup>
          </select>
        </motion.div>

        {/* Peter Pan Compass */}
        <motion.div
          className="relative"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.3 }}
        >
          {/* Compass outer ring glow */}
          <motion.div
            className="absolute -inset-8 rounded-full bg-amber-500/20 blur-2xl"
            animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 3, repeat: Infinity }}
          />

          {/* Compass body */}
          <div className="relative h-72 w-72 rounded-full border-4 border-amber-600/50 bg-gradient-to-br from-amber-900/40 via-amber-800/30 to-amber-900/50 p-2 shadow-2xl backdrop-blur-sm">
            {/* Inner decorative ring */}
            <div className="absolute inset-4 rounded-full border-2 border-amber-500/30" />
            <div className="absolute inset-8 rounded-full border border-amber-400/20" />

            {/* Elevation arc indicator */}
            <svg className="absolute inset-0 h-full w-full" viewBox="0 0 288 288">
              {/* Elevation scale arc */}
              <defs>
                <linearGradient id="elevationGradient" x1="0%" y1="100%" x2="0%" y2="0%">
                  <stop offset="0%" stopColor="#22c55e" stopOpacity="0.3" />
                  <stop offset="50%" stopColor="#eab308" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity="0.3" />
                </linearGradient>
              </defs>
              {/* Background arc showing elevation range */}
              <path
                d={`M 144 144 L 144 40 A 104 104 0 0 1 248 144`}
                fill="url(#elevationGradient)"
                opacity="0.3"
              />
              {/* Current elevation indicator */}
              {altitude > 0 && (
                <motion.line
                  x1="144"
                  y1="144"
                  x2={144 + 90 * Math.cos((90 - altitude) * Math.PI / 180)}
                  y2={144 - 90 * Math.sin((90 - altitude) * Math.PI / 180)}
                  stroke="#22c55e"
                  strokeWidth="2"
                  strokeLinecap="round"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.8 }}
                  transition={{ duration: 0.5 }}
                />
              )}
            </svg>

            {/* Compass directions */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="absolute top-6 text-xl font-bold text-amber-200" style={{ fontFamily: 'Georgia, serif' }}>N</span>
              <span className="absolute bottom-6 text-lg text-amber-300/70" style={{ fontFamily: 'Georgia, serif' }}>S</span>
              <span className="absolute left-6 text-lg text-amber-300/70" style={{ fontFamily: 'Georgia, serif' }}>W</span>
              <span className="absolute right-6 text-lg text-amber-300/70" style={{ fontFamily: 'Georgia, serif' }}>E</span>
            </div>

            {/* Small direction markers */}
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="absolute left-1/2 top-1/2 h-full w-0.5"
                style={{
                  transform: `translate(-50%, -50%) rotate(${i * 30}deg)`,
                }}
              >
                <div
                  className={`mx-auto ${i % 3 === 0 ? 'h-4 w-1 bg-amber-400/60' : 'h-2 w-0.5 bg-amber-500/40'}`}
                  style={{ marginTop: '12px' }}
                />
              </div>
            ))}

            {/* Compass needle container */}
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              animate={{ rotate: azimuth }}
              transition={{ type: "spring", stiffness: 50, damping: 10 }}
            >
              {/* North needle (gold/fairy dust) - points to destination */}
              <svg
                className="absolute"
                width="40"
                height="120"
                viewBox="0 0 40 120"
                style={{ transform: 'translateY(-30px)' }}
              >
                <defs>
                  <linearGradient id="northGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#FFD700" />
                    <stop offset="50%" stopColor="#FFA500" />
                    <stop offset="100%" stopColor="#B8860B" />
                  </linearGradient>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                    <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                <polygon
                  points="20,0 30,60 20,50 10,60"
                  fill="url(#northGradient)"
                  filter="url(#glow)"
                />
              </svg>

              {/* South needle (green/Peter Pan) */}
              <svg
                className="absolute"
                width="40"
                height="120"
                viewBox="0 0 40 120"
                style={{ transform: 'translateY(30px) rotate(180deg)' }}
              >
                <defs>
                  <linearGradient id="southGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#228B22" />
                    <stop offset="50%" stopColor="#32CD32" />
                    <stop offset="100%" stopColor="#006400" />
                  </linearGradient>
                </defs>
                <polygon
                  points="20,0 30,60 20,50 10,60"
                  fill="url(#southGradient)"
                />
              </svg>

              {/* Center jewel */}
              <motion.div
                className="absolute h-8 w-8 rounded-full border-2 border-amber-400 bg-gradient-to-br from-amber-300 via-yellow-200 to-amber-400"
                animate={{
                  boxShadow: [
                    '0 0 10px #FFD700, 0 0 20px #FFD700',
                    '0 0 20px #FFD700, 0 0 40px #FFD700',
                    '0 0 10px #FFD700, 0 0 20px #FFD700',
                  ],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </motion.div>

            {/* Decorative fairy wings pattern */}
            <svg className="absolute inset-0 h-full w-full opacity-20" viewBox="0 0 288 288">
              <path
                d="M144 80 Q180 100 180 144 Q180 188 144 208 Q108 188 108 144 Q108 100 144 80"
                fill="none"
                stroke="#FFD700"
                strokeWidth="1"
              />
              <path
                d="M80 144 Q100 108 144 108 Q188 108 208 144 Q188 180 144 180 Q100 180 80 144"
                fill="none"
                stroke="#FFD700"
                strokeWidth="1"
              />
            </svg>
          </div>
        </motion.div>

        {/* Direction info */}
        <motion.div
          className="mt-8 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <p className="text-2xl font-semibold text-amber-100" style={{ fontFamily: 'Georgia, serif' }}>
            {selectedDestination.icon} {selectedDestination.name}
          </p>
          <p className="mt-2 text-lg text-amber-300/80">
            {Math.round(azimuth)}° {getDirectionLabel(azimuth)}
            {selectedDestination.category !== 'landmark' && (
              <span className="ml-3">
                Elevation: {altitude > 0 ? `${Math.round(altitude)}° above horizon` : 'Below horizon'}
              </span>
            )}
          </p>
          {/* Distance display */}
          <p className="mt-2 text-base text-emerald-300/80">
            Distance: {distanceDisplay}
          </p>
        </motion.div>

        {/* Location status */}
        <motion.p
          className="mt-4 text-xs text-amber-300/40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          {locationStatus === 'loading' && 'Locating you among the stars...'}
          {locationStatus === 'granted' && userLocation && `Your location: ${userLocation.lat.toFixed(2)}°, ${userLocation.lng.toFixed(2)}°`}
          {locationStatus === 'denied' && 'Using San Francisco as default location'}
        </motion.p>

        {/* Quote */}
        <motion.p
          className="mt-6 max-w-md text-center text-lg italic text-amber-200/60"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          style={{ fontFamily: 'Georgia, serif' }}
        >
          "All you need is faith, trust, and a little bit of pixie dust."
        </motion.p>
      </div>
    </div>
  )
}

export default PeterPanCompass
