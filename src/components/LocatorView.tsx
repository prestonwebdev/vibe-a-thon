import { useState, useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { GlobeScene } from './GlobeScene'
import { LoadingScreen } from './LoadingScreen'
import { useHandTracking } from '../hooks/useHandTracking'
import { useLocation } from '../hooks/useLocation'
import { useDeviceOrientation, isPointingAt, getDeviceAltitude } from '../hooks/useDeviceOrientation'
import { SIRIUS, getSiriusPosition, getSirius3DPosition, getCompassDirection } from '../data/sirius'

// Detect if device is mobile/touch
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0
      const isSmallScreen = window.innerWidth < 768
      setIsMobile(isTouchDevice && isSmallScreen)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return isMobile
}

export function LocatorView() {
  console.log('[LocatorView] Component rendering')

  const [isLoading, setIsLoading] = useState(false)
  const [showScene, setShowScene] = useState(true)
  const isMobile = useIsMobile()

  console.log('[LocatorView] State:', { isLoading, showScene, isMobile })

  // Only use hand tracking on desktop
  const { videoRef, gesture, isReady } = useHandTracking(!isMobile)
  const { location, isLoading: isLocationLoading } = useLocation()

  console.log('[LocatorView] Location:', { location, isLocationLoading, isReady })
  const { orientation, isSupported: isGyroSupported, isPermissionGranted: isGyroGranted, requestPermission: requestGyroPermission } = useDeviceOrientation()
  const [zoom, setZoom] = useState(1)
  const zoomRef = useRef(1)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isPointingAtSirius, setIsPointingAtSirius] = useState(false)
  const [pointingDistance, setPointingDistance] = useState(180)

  // Update time every minute for astronomical calculations
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)
    return () => clearInterval(interval)
  }, [])

  // Calculate Sirius position based on current location and time
  const siriusData = useMemo(() => {
    if (!location) return null
    return getSiriusPosition(location.latitude, location.longitude, currentTime)
  }, [location, currentTime])

  // Get 3D position for visualization
  const sirius3DPosition = useMemo(() => {
    if (!siriusData) return { x: 8, y: 4, z: -6 } // Default position
    return getSirius3DPosition(siriusData.altitude, siriusData.azimuth, 10)
  }, [siriusData])

  // Check if device is pointing at Sirius (mobile gyroscope)
  useEffect(() => {
    if (!siriusData || !orientation.alpha) return

    // Get device altitude from beta (tilt)
    const deviceAltitude = getDeviceAltitude(orientation.beta)

    // Check if pointing at Sirius
    const { isPointing, distance } = isPointingAt(
      orientation.alpha,
      deviceAltitude,
      siriusData.azimuth,
      siriusData.altitude,
      20 // 20 degree tolerance
    )

    setIsPointingAtSirius(isPointing)
    setPointingDistance(distance)
  }, [orientation, siriusData])

  // Momentum-based rotation
  const [velocity, setVelocity] = useState({ x: 0, y: 0 })
  const velocityRef = useRef({ x: 0, y: 0 })
  const animationFrameRef = useRef<number>()

  // Physics constants
  const DRAG_SENSITIVITY = 8
  const FRICTION = 0.96
  const MIN_VELOCITY = 0.0001

  const handleLoadingComplete = () => {
    setIsLoading(false)
    // Small delay before showing scene for smooth transition
    setTimeout(() => setShowScene(true), 100)
  }

  useEffect(() => {
    // Double pinch controls zoom
    if (gesture.isDoublePinch) {
      const zoomDelta = gesture.twoHandDistanceDelta * 3
      zoomRef.current = Math.max(0.3, Math.min(3, zoomRef.current + zoomDelta))
      setZoom(zoomRef.current)
    }

    // Open palm controls rotation
    if (gesture.isOpenPalm && !gesture.isDoublePinch) {
      velocityRef.current = {
        x: gesture.deltaY * DRAG_SENSITIVITY,
        y: -gesture.deltaX * DRAG_SENSITIVITY,
      }
      setVelocity(velocityRef.current)
    }
  }, [gesture])

  // Animation loop for momentum
  useEffect(() => {
    const animate = () => {
      if (!gesture.isOpenPalm || gesture.isDoublePinch) {
        velocityRef.current = {
          x: velocityRef.current.x * FRICTION,
          y: velocityRef.current.y * FRICTION,
        }

        if (Math.abs(velocityRef.current.x) < MIN_VELOCITY &&
            Math.abs(velocityRef.current.y) < MIN_VELOCITY) {
          velocityRef.current = { x: 0, y: 0 }
        }

        setVelocity({ ...velocityRef.current })
      }

      animationFrameRef.current = requestAnimationFrame(animate)
    }

    animationFrameRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [gesture.isOpenPalm, gesture.isDoublePinch])

  const getGestureStatus = () => {
    if (gesture.isDoublePinch) return 'Flying closer...'
    if (gesture.isOpenPalm) return 'Navigating'
    if (Math.abs(velocity.x) > MIN_VELOCITY || Math.abs(velocity.y) > MIN_VELOCITY) return 'Drifting'
    if (gesture.hasHand) return 'Hand detected'
    return 'Raise your hand'
  }

  const getGestureColor = () => {
    if (gesture.isDoublePinch) return 'bg-yellow-400'
    if (gesture.isOpenPalm) return 'bg-green-400'
    if (Math.abs(velocity.x) > MIN_VELOCITY || Math.abs(velocity.y) > MIN_VELOCITY) return 'bg-blue-400'
    if (gesture.hasHand) return 'bg-purple-400'
    return 'bg-gray-500'
  }

  return (
    <>
      {/* Loading Screen */}
      <AnimatePresence>
        {isLoading && <LoadingScreen onComplete={handleLoadingComplete} />}
      </AnimatePresence>

      {/* Main Scene */}
      <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#0a0a1a] via-[#0d1033] to-[#0a0a1a] text-white">
        {/* Hidden video element for hand tracking */}
        <video
          ref={videoRef}
          className="absolute left-0 top-0 h-1 w-1 opacity-0"
          playsInline
        />

        {/* Magical gradient orbs */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute -left-32 top-1/3 h-[500px] w-[500px] rounded-full bg-indigo-600/10 blur-3xl"
            animate={{ x: [0, 80, 0], y: [0, -40, 0] }}
            transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute -right-32 top-1/2 h-[400px] w-[400px] rounded-full bg-purple-600/10 blur-3xl"
            animate={{ x: [0, -60, 0], y: [0, 30, 0] }}
            transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          />
          {/* Golden pixie dust glow */}
          <motion.div
            className="absolute left-1/2 top-1/4 h-32 w-32 -translate-x-1/2 rounded-full bg-yellow-400/20 blur-2xl"
            animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        <AnimatePresence>
          {showScene && (
            <>
              {/* Header */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="absolute left-0 right-0 top-16 z-10 text-center"
              >
                <h1 className="font-serif text-2xl font-light tracking-widest text-white/80 md:text-3xl">
                  Second Star to the Right
                </h1>
                <p className="mt-2 mb-8 text-sm text-white/40">
                  and straight on 'til morning
                </p>
              </motion.div>

              {/* Navigation Scene */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0"
              >
                <GlobeScene zoom={zoom} rotationX={velocity.x} rotationY={velocity.y} siriusPosition={sirius3DPosition} isPointingAtSirius={isPointingAtSirius} />
              </motion.div>

              {/* Destination Info */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="absolute right-6 top-32 z-10 text-right"
              >
                <div className="rounded-lg bg-white/5 px-4 py-3 backdrop-blur-sm">
                  <p className="text-xs uppercase tracking-wider text-white/40">Destination</p>
                  <p className="mt-1 text-lg font-light text-blue-300">{SIRIUS.name}</p>
                  <p className="text-xs text-yellow-400/80">{SIRIUS.destination}</p>
                  <div className="mt-2 border-t border-white/10 pt-2 space-y-1">
                    <p className="text-xs text-white/40">{SIRIUS.lightYears} light years</p>
                    <p className="text-xs text-white/30">{(SIRIUS.lightYears * 9.461).toFixed(1)} trillion km</p>
                    <p className="text-xs text-white/30">{(SIRIUS.lightYears * 5.879).toFixed(1)} trillion miles</p>
                  </div>
                  {siriusData && (
                    <div className="mt-2 border-t border-white/10 pt-2 space-y-1">
                      <p className={`text-xs ${siriusData.isVisible ? 'text-green-400' : 'text-red-400/70'}`}>
                        {siriusData.isVisible ? 'Visible now!' : 'Below horizon'}
                      </p>
                      <p className="text-xs text-white/40">
                        {getCompassDirection(siriusData.azimuth)} {Math.round(siriusData.altitude)} alt
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Legend & Location */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="absolute left-6 top-32 z-10"
              >
                <div className="rounded-lg bg-white/5 px-4 py-3 backdrop-blur-sm">
                  {location && (
                    <div className="mb-3 pb-2 border-b border-white/10">
                      <p className="text-xs uppercase tracking-wider text-white/40">Your Location</p>
                      <p className="mt-1 text-sm text-green-300">
                        {location.city || 'Unknown'}{location.country ? `, ${location.country}` : ''}
                      </p>
                      <p className="text-xs text-white/30">
                        {location.latitude.toFixed(2)}, {location.longitude.toFixed(2)}
                      </p>
                      <p className="text-xs text-white/30 mt-1">
                        {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-green-400" />
                    <span className="text-xs text-white/60">You are here</span>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-blue-300 shadow-lg shadow-blue-400/50" />
                    <span className="text-xs text-white/60">Sirius (Neverland)</span>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="h-3 w-1 bg-gradient-to-r from-yellow-400 to-transparent" />
                    <span className="text-xs text-white/60">Pixie dust trail</span>
                  </div>
                </div>
              </motion.div>

              {/* Controls */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="absolute bottom-6 left-0 right-0 z-10 text-center"
              >
                <div className="mx-auto max-w-md space-y-3 px-4">
                  {/* Loading state (mobile and desktop) */}
                  {isLocationLoading && (
                    <div className="flex items-center justify-center gap-3">
                      <motion.div
                        className="h-2 w-2 rounded-full bg-yellow-400"
                        animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                      <span className="text-sm text-white/50">
                        Finding your location...
                      </span>
                    </div>
                  )}

                  {/* Mobile: Gyroscope pointing indicator */}
                  {isMobile && !isLocationLoading && isGyroSupported && isGyroGranted && siriusData?.isVisible && (
                    <motion.div
                      className={`rounded-lg px-6 py-4 backdrop-blur-sm transition-all duration-300 ${
                        isPointingAtSirius
                          ? 'bg-yellow-400/30 shadow-lg shadow-yellow-400/50'
                          : 'bg-white/5'
                      }`}
                      animate={isPointingAtSirius ? {
                        scale: [1, 1.05, 1],
                      } : {}}
                      transition={{ duration: 0.5, repeat: isPointingAtSirius ? Infinity : 0 }}
                    >
                      {isPointingAtSirius ? (
                        <div className="text-center">
                          <motion.p
                            className="text-lg font-light text-yellow-300"
                            animate={{ opacity: [0.8, 1, 0.8] }}
                            transition={{ duration: 1, repeat: Infinity }}
                          >
                            You found Neverland!
                          </motion.p>
                          <p className="mt-1 text-xs text-yellow-200/70">
                            Sirius is right there!
                          </p>
                        </div>
                      ) : (
                        <div className="text-center">
                          <p className="text-sm text-white/70">
                            Point your phone at {getCompassDirection(siriusData.azimuth)}, {Math.round(siriusData.altitude)} up
                          </p>
                          <p className="mt-1 text-xs text-white/40">
                            {pointingDistance < 45 ? 'Getting warmer...' : 'Searching for Sirius...'}
                          </p>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* Mobile: Gyroscope permission button (iOS) */}
                  {isMobile && !isLocationLoading && isGyroSupported && !isGyroGranted && (
                    <button
                      onClick={requestGyroPermission}
                      className="rounded-lg bg-yellow-400/20 px-6 py-3 text-sm text-yellow-300 hover:bg-yellow-400/30 transition-colors"
                    >
                      Enable compass to find Sirius
                    </button>
                  )}

                  {/* Mobile: Simple instructions when gyro not available or Sirius not visible */}
                  {isMobile && !isLocationLoading && (!isGyroSupported || !siriusData?.isVisible) && siriusData && (
                    <div className="rounded-lg bg-white/5 px-6 py-4 backdrop-blur-sm">
                      <p className="text-sm text-white/70">
                        {siriusData.isVisible
                          ? `Look ${getCompassDirection(siriusData.azimuth)}, ${Math.round(siriusData.altitude)} above horizon`
                          : 'Sirius is below the horizon right now'}
                      </p>
                    </div>
                  )}

                  {/* Desktop: Hand tracking controls */}
                  {!isMobile && !isLocationLoading && (
                    <>
                      {!isReady ? (
                        <div className="flex items-center justify-center gap-3">
                          <motion.div
                            className="h-2 w-2 rounded-full bg-yellow-400"
                            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                          />
                          <span className="text-sm text-white/50">
                            Gathering pixie dust...
                          </span>
                        </div>
                      ) : (
                        <div className="rounded-lg bg-white/5 px-6 py-4 backdrop-blur-sm">
                          <div className="flex items-center justify-center gap-3">
                            <div className={`h-2 w-2 rounded-full transition-colors ${getGestureColor()}`} />
                            <span className="text-sm text-white/70">{getGestureStatus()}</span>
                          </div>
                          <div className="mt-3 flex justify-center gap-6 text-xs text-white/40">
                            <span>Open palm to navigate</span>
                            <span>|</span>
                            <span>Pinch both hands to fly</span>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </>
  )
}
